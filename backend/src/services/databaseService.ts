import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Collection, Db, MongoClient } from 'mongodb';
import {
  User,
  Subject,
  Topic,
  Question,
  Test,
  Exam,
  TestAttempt,
  QuestionAttempt,
  Recommendation,
  AdminRequest,
  AuditLog
} from '../../types';
import {
  INITIAL_SUBJECTS,
  INITIAL_EXAMS,
  INITIAL_TOPICS,
  INITIAL_QUESTIONS,
  INITIAL_TESTS,
  INITIAL_USERS,
  UPPET_REASONING_TOPICS,
  UPPET_REASONING_QUESTIONS,
  UPPET_REASONING_TESTS,
  UPPET_GENERAL_STUDIES_TOPICS,
  UPPET_GENERAL_STUDIES_QUESTIONS,
  UPPET_GENERAL_STUDIES_TESTS,
  UPPET_PAPER_MOCK_TOPICS,
  UPPET_PAPER_MOCK_QUESTIONS,
  UPPET_PAPER_MOCK_TESTS
} from '../../../database/seedData';

interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  exams: Exam[];
  subjects: Subject[];
  topics: Topic[];
  questions: Question[];
  tests: Test[];
  testAttempts: TestAttempt[];
  questionAttempts: QuestionAttempt[];
  recommendations: Recommendation[];
  adminRequests: AdminRequest[];
  auditLogs: AuditLog[];
}

type StateCollection = keyof DatabaseSchema;
type PersistedDocument = { id: string; [key: string]: unknown };
type MongoStoredDocument = PersistedDocument & { _id: string };

class PersistenceDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PersistenceDataError';
  }
}

const STATE_COLLECTIONS: StateCollection[] = [
  'users',
  'exams',
  'subjects',
  'topics',
  'questions',
  'tests',
  'testAttempts',
  'questionAttempts',
  'recommendations',
  'adminRequests',
  'auditLogs'
];

const MONGO_COLLECTION_NAMES: Record<StateCollection, string> = {
  users: 'users',
  exams: 'exams',
  subjects: 'subjects',
  topics: 'topics',
  questions: 'questions',
  tests: 'tests',
  testAttempts: 'test_attempts',
  questionAttempts: 'question_attempts',
  recommendations: 'recommendations',
  adminRequests: 'admin_requests',
  auditLogs: 'audit_logs'
};

const configuredDatabaseFile = process.env.DATABASE_FILE?.trim();
const MONGODB_URI = process.env.MONGODB_URI?.trim();
const DB_FILE = configuredDatabaseFile
  ? path.resolve(configuredDatabaseFile)
  : path.resolve(process.cwd(), 'database', 'storage.json');
const DB_DIR = path.dirname(DB_FILE);

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    exams: [],
    subjects: [],
    topics: [],
    questions: [],
    tests: [],
    testAttempts: [],
    questionAttempts: [],
    recommendations: [],
    adminRequests: [],
    auditLogs: []
  };

  private initialized = false;
  private mongoDb?: Db;
  private mongoClient?: MongoClient;
  private persistQueue: Promise<void> = Promise.resolve();
  private pendingCollections = new Set<StateCollection>();
  private recoveryPromise?: Promise<boolean>;
  private persistenceError?: Error;
  public readonly ready: Promise<void>;

  constructor() {
    if (process.env.NODE_ENV === 'production' && !MONGODB_URI) {
      this.ready = Promise.reject(new Error('MONGODB_URI must be configured in production.'));
    } else {
      this.ready = MONGODB_URI ? this.initMongo() : Promise.resolve(this.initLocal());
    }
  }

  public get isAvailable(): boolean {
    return !this.persistenceError;
  }

  private createMongoClient(): MongoClient {
    const client = new MongoClient(MONGODB_URI!, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
    client.on('error', err => this.markPersistenceError('client connection', err));
    return client;
  }

  private markPersistenceError(operation: string, err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    this.persistenceError = error;
    const safeMessage = error.message
      .replace(/mongodb(?:\+srv)?:\/\/[^\s]+/gi, 'mongodb://[redacted]')
      .replace(/(password|passwd|pwd|secret|token|api[_-]?key)=([^&\s]+)/gi, '$1=[redacted]');
    console.error(`MongoDB ${operation} failed [${error.name}]: ${safeMessage}`);
  }

  private recommendationCanonicalValue(recommendation: Recommendation) {
    return JSON.stringify({
      studentId: recommendation.studentId,
      topicId: recommendation.topicId,
      topic: recommendation.topic,
      subjectName: recommendation.subjectName,
      performanceScore: recommendation.performanceScore,
      performanceLevel: recommendation.performanceLevel,
      recommendedDifficulty: recommendation.recommendedDifficulty,
      action: recommendation.action,
      reason: recommendation.reason,
      revisionTips: recommendation.revisionTips
    });
  }

  private getStableRecommendationId(recommendation: Recommendation): string {
    return `rec-${Buffer.from(this.recommendationCanonicalValue(recommendation)).toString('base64url')}`;
  }

  private normalizeRecommendations(recommendations: Recommendation[], operation: string): Recommendation[] {
    const normalized: Recommendation[] = [];
    const byStableId = new Map<string, string>();
    let duplicateCount = 0;

    for (const recommendation of recommendations) {
      const stableId = this.getStableRecommendationId(recommendation);
      const canonicalValue = this.recommendationCanonicalValue(recommendation);
      const previousValue = byStableId.get(stableId);
      if (previousValue === canonicalValue) {
        duplicateCount++;
        continue;
      }
      if (previousValue) {
        console.error('MongoDB recommendation validation failed', JSON.stringify({
          operation,
          recommendationStableId: stableId,
          recommendationTopic: recommendation.topic,
          recommendationType: recommendation.performanceLevel,
          numberOfRecommendations: recommendations.length,
          duplicateIdsDetected: [stableId]
        }));
        throw new PersistenceDataError(`Recommendation stable-ID collision for ${stableId}.`);
      }
      byStableId.set(stableId, canonicalValue);
      normalized.push({ ...recommendation, id: stableId });
    }

    if (duplicateCount > 0) {
      console.warn(`MongoDB ${operation}: deduplicated recommendations`, JSON.stringify({
        operation,
        numberOfRecommendations: recommendations.length,
        duplicateIdsDetected: duplicateCount,
        recommendationStableIds: normalized.map(recommendation => recommendation.id),
        recommendationTopics: normalized.map(recommendation => recommendation.topic),
        recommendationTypes: normalized.map(recommendation => recommendation.performanceLevel)
      }));
    }
    return normalized;
  }

  private initLocal() {
    try {
      console.log(`Using database storage file: ${DB_FILE}`);
      if (process.env.NODE_ENV === 'production' && !configuredDatabaseFile) {
        console.warn('DATABASE_FILE is not configured; production data will be stored on the service filesystem and may be lost on restart.');
      }

      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = this.normalizeSchema(JSON.parse(raw));
        this.migrateSchema();
      } else {
        this.seedInitialData();
      }
      this.initialized = true;
    } catch (err) {
      console.error('Error initializing database storage:', err);
      this.seedInitialData();
    }
  }

  private async initMongo() {
    try {
      this.mongoClient = this.createMongoClient();
      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db();
      await this.createMongoIndexes();

      const hasPersistedData = (await Promise.all(STATE_COLLECTIONS.map(key =>
        this.mongoDb!.collection(MONGO_COLLECTION_NAMES[key]).countDocuments({}, { limit: 1 })
      ))).some(count => count > 0);
      if (hasPersistedData) {
        this.data = await this.loadMongoState();
        this.migrateSchema();
        await this.flush();
      } else {
        const legacyState = await this.mongoDb.collection<DatabaseSchema & { _id: string }>('application_state').findOne({ _id: 'main' });
        if (legacyState) {
          const { _id, ...legacyData } = legacyState;
          this.data = this.normalizeSchema(legacyData);
          this.migrateSchema();
          // Preserve the legacy document and copy it into the collection-based layout.
          this.persist();
        } else {
          this.seedInitialData();
        }
        await this.flush();
      }

      this.initialized = true;
      console.log('Using MongoDB persistent collections.');
    } catch (err) {
      console.error('MongoDB initialization failed. Check the private MONGODB_URI setting and Atlas network access.');
      await this.mongoClient?.close().catch(() => undefined);
      this.mongoClient = undefined;
      this.mongoDb = undefined;
      throw new Error('MongoDB is configured but could not be initialized. Refusing to fall back to local storage.');
    }
  }

  private normalizeSchema(data: Partial<DatabaseSchema>): DatabaseSchema {
    return {
      users: data.users ?? [],
      exams: data.exams ?? [],
      subjects: data.subjects ?? [],
      topics: data.topics ?? [],
      questions: data.questions ?? [],
      tests: data.tests ?? [],
      testAttempts: data.testAttempts ?? [],
      questionAttempts: data.questionAttempts ?? [],
      recommendations: this.normalizeRecommendations(data.recommendations ?? [], 'load recommendations'),
      adminRequests: data.adminRequests ?? [],
      auditLogs: data.auditLogs ?? []
    };
  }

  private async createMongoIndexes() {
    if (!this.mongoDb) return;
    await Promise.all([
      this.mongoDb.collection(MONGO_COLLECTION_NAMES.users).createIndex({ email: 1 }, { unique: true }),
      this.mongoDb.collection(MONGO_COLLECTION_NAMES.testAttempts).createIndex({ studentId: 1, createdAt: -1 }),
      this.mongoDb.collection(MONGO_COLLECTION_NAMES.questionAttempts).createIndex({ studentId: 1, createdAt: -1 }),
      this.mongoDb.collection(MONGO_COLLECTION_NAMES.recommendations).createIndex({ studentId: 1 }),
      this.mongoDb.collection(MONGO_COLLECTION_NAMES.adminRequests).createIndex({ userId: 1, createdAt: -1 }),
      this.mongoDb.collection(MONGO_COLLECTION_NAMES.auditLogs).createIndex({ timestamp: -1 })
    ]);
  }

  private async loadMongoState(): Promise<DatabaseSchema> {
    if (!this.mongoDb) throw new Error('MongoDB has not been initialized.');
    const entries = await Promise.all(STATE_COLLECTIONS.map(async key => {
      const documents = await this.mongoDb!
        .collection(MONGO_COLLECTION_NAMES[key])
        .find({}, { projection: { _id: 0 } })
        .toArray();
      return [key, documents] as const;
    }));
    return this.normalizeSchema(Object.fromEntries(entries) as Partial<DatabaseSchema>);
  }

  private seedInitialData() {
    console.log('Seeding initial academic database records...');
    const studentHash = bcrypt.hashSync('student123', 10);
    const adminHash = bcrypt.hashSync('admin123', 10);

    const seededUsers = INITIAL_USERS.map(user => ({
      ...user,
      status: 'ACTIVE' as const,
      passwordHash: user.role === 'USER' ? studentHash : adminHash
    }));

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
    if (process.env.NODE_ENV === 'production' && (!superAdminEmail || !superAdminPassword)) {
      throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be configured when initializing production storage.');
    }
    if (superAdminEmail && superAdminPassword) {
      seededUsers.push({
        id: 'user-super-admin',
        name: 'ANSHUMAN MISHRA',
        email: superAdminEmail,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        passwordHash: bcrypt.hashSync(superAdminPassword, 10),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    this.data = {
      users: seededUsers,
      exams: INITIAL_EXAMS,
      subjects: INITIAL_SUBJECTS,
      topics: INITIAL_TOPICS,
      questions: [...INITIAL_QUESTIONS, ...UPPET_REASONING_QUESTIONS, ...UPPET_GENERAL_STUDIES_QUESTIONS, ...UPPET_PAPER_MOCK_QUESTIONS],
      tests: [...INITIAL_TESTS, ...UPPET_REASONING_TESTS, ...UPPET_GENERAL_STUDIES_TESTS, ...UPPET_PAPER_MOCK_TESTS],
      testAttempts: [],
      questionAttempts: [],
      recommendations: [],
      adminRequests: [],
      auditLogs: []
    };

    this.persist();
  }

  private migrateSchema() {
    let changed = false;
    this.data.adminRequests ??= [];
    this.data.auditLogs ??= [];
    for (const user of this.data.users) {
      const rawRole = String(user.role);
      const migratedRole = rawRole === 'student' ? 'USER' : rawRole === 'admin' ? 'ADMIN' : user.role;
      if (user.role !== migratedRole) {
        user.role = migratedRole;
        changed = true;
      }
      if (!user.status) {
        user.status = 'ACTIVE';
        changed = true;
      }
    }
    for (const request of this.data.adminRequests) {
      if (!request.type) {
        request.type = 'ADMIN_REGISTRATION';
        changed = true;
      }
      if (request.type === 'ADMIN_REGISTRATION' && !request.requestedRole) {
        request.requestedRole = 'ADMIN';
        changed = true;
      }
    }

    const configuredSuperAdminEmail = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    if (process.env.NODE_ENV === 'production' && !configuredSuperAdminEmail) {
      throw new Error('SUPER_ADMIN_EMAIL must be configured in production.');
    }
    if (configuredSuperAdminEmail) {
      const superAdmin = this.data.users.find(user => user.email.toLowerCase() === configuredSuperAdminEmail);
      for (const user of this.data.users) {
        if (user.role === 'SUPER_ADMIN' && user.email.toLowerCase() !== configuredSuperAdminEmail) {
          user.role = 'ADMIN';
          user.updatedAt = new Date().toISOString();
          changed = true;
        }
      }
      if (superAdmin && superAdmin.role !== 'SUPER_ADMIN') {
        superAdmin.role = 'SUPER_ADMIN';
        superAdmin.updatedAt = new Date().toISOString();
        changed = true;
      }
      if (!superAdmin) {
        const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
        if (!superAdminPassword) {
          throw new Error('SUPER_ADMIN_PASSWORD is required to bootstrap the configured Super Admin account.');
        }
        this.data.users.push({
          id: 'user-super-admin',
          name: 'ANSHUMAN MISHRA',
          email: configuredSuperAdminEmail,
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
          passwordHash: bcrypt.hashSync(superAdminPassword, 10),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        changed = true;
      }
    }

    if (changed) this.persist('users', 'adminRequests');
    this.migrateAcademicCategories();
  }

  private migrateAcademicCategories() {
    let changed = false;
    if (!this.data.exams) {
      this.data.exams = [];
      changed = true;
    }
    for (const exam of INITIAL_EXAMS) {
      if (!this.data.exams.some(existing => existing.id === exam.id)) {
        this.data.exams.push(exam);
        changed = true;
      }
    }
    for (const subject of this.data.subjects) {
      if (!subject.examId) {
        subject.examId = 'exam-computer-science';
        changed = true;
      }
    }
    for (const subject of INITIAL_SUBJECTS) {
      const existingSubject = this.data.subjects.find(existing => existing.id === subject.id);
      if (!existingSubject) {
        this.data.subjects.push(subject);
        changed = true;
      } else if (subject.id === 'subj-uppet-paper-mock' && existingSubject.description !== subject.description) {
        existingSubject.description = subject.description;
        changed = true;
      }
    }
    for (const topic of UPPET_REASONING_TOPICS) {
      if (!this.data.topics.some(existing => existing.id === topic.id)) {
        this.data.topics.push(topic);
        changed = true;
      }
    }
    for (const topic of UPPET_GENERAL_STUDIES_TOPICS) {
      if (!this.data.topics.some(existing => existing.id === topic.id)) {
        this.data.topics.push(topic);
        changed = true;
      }
    }
    for (const question of UPPET_REASONING_QUESTIONS) {
      if (!this.data.questions.some(existing => existing.id === question.id)) {
        this.data.questions.push(question);
        changed = true;
      }
    }
    for (const question of UPPET_GENERAL_STUDIES_QUESTIONS) {
      if (!this.data.questions.some(existing => existing.id === question.id)) {
        this.data.questions.push(question);
        changed = true;
      }
    }
    for (const test of UPPET_REASONING_TESTS) {
      if (!this.data.tests.some(existing => existing.id === test.id)) {
        this.data.tests.push(test);
        changed = true;
      }
    }
    for (const test of UPPET_GENERAL_STUDIES_TESTS) {
      if (!this.data.tests.some(existing => existing.id === test.id)) {
        this.data.tests.push(test);
        changed = true;
      }
    }
    for (const topic of UPPET_PAPER_MOCK_TOPICS) {
      if (!this.data.topics.some(existing => existing.id === topic.id)) {
        this.data.topics.push(topic);
        changed = true;
      }
    }
    for (const question of UPPET_PAPER_MOCK_QUESTIONS) {
      if (!this.data.questions.some(existing => existing.id === question.id)) {
        this.data.questions.push(question);
        changed = true;
      }
    }
    for (const test of UPPET_PAPER_MOCK_TESTS) {
      if (!this.data.tests.some(existing => existing.id === test.id)) {
        this.data.tests.push(test);
        changed = true;
      }
    }
    if (changed) this.persist('exams', 'subjects', 'topics', 'questions', 'tests');
  }

  public persist(...collections: StateCollection[]) {
    if (MONGODB_URI && this.mongoDb) {
      const collectionsToPersist = collections.length > 0 ? collections : STATE_COLLECTIONS;
      collectionsToPersist.forEach(collection => this.pendingCollections.add(collection));
      this.enqueuePendingPersistence();
      return;
    }

    this.persistToLocalFile();
  }

  private async persistToMongo(collections: StateCollection[]): Promise<void> {
    if (!this.mongoDb) throw new Error('MongoDB has not been initialized.');
    for (const key of new Set(collections)) {
      await this.replaceMongoCollection(key, this.data[key] as unknown as PersistedDocument[]);
    }
  }

  private enqueuePendingPersistence() {
    const collections = [...this.pendingCollections];
    if (collections.length === 0) return;
    this.persistQueue = this.persistQueue.then(async () => {
      try {
        await this.persistToMongoWithRetry(collections);
        collections.forEach(collection => this.pendingCollections.delete(collection));
      } catch (err) {
        if (err instanceof PersistenceDataError) {
          collections.forEach(collection => this.pendingCollections.delete(collection));
          console.error(`MongoDB data validation failed while persisting ${collections.join(', ')} [${err.name}]: ${err.message}`);
        } else {
          this.markPersistenceError(`persisting ${collections.join(', ')}`, err);
        }
      }
    });
  }

  private async persistToMongoWithRetry(collections: StateCollection[]) {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (!(await this.recoverMongoConnection())) {
          throw this.persistenceError || new Error('MongoDB connection is unavailable.');
        }
        await this.persistToMongo(collections);
        this.persistenceError = undefined;
        return;
      } catch (err) {
        if (err instanceof PersistenceDataError) throw err;
        this.markPersistenceError(`persisting ${collections.join(', ')}`, err);
        if (attempt === maxAttempts) throw err;
        await new Promise(resolve => setTimeout(resolve, 250 * 2 ** (attempt - 1)));
      }
    }
  }

  private async recoverMongoConnection(): Promise<boolean> {
    if (!MONGODB_URI) return true;
    if (this.recoveryPromise) return this.recoveryPromise;

    this.recoveryPromise = (async () => {
      try {
        if (this.mongoDb) {
          await this.mongoDb.command({ ping: 1 });
          this.persistenceError = undefined;
          return true;
        }
      } catch (err) {
        this.markPersistenceError('health check', err);
      }

      try {
        await this.mongoClient?.close().catch(() => undefined);
        const client = this.createMongoClient();
        try {
          await client.connect();
          const database = client.db();
          await database.command({ ping: 1 });
          this.mongoClient = client;
          this.mongoDb = database;
          this.persistenceError = undefined;
          console.log('MongoDB connection recovered.');
          return true;
        } catch (err) {
          await client.close().catch(() => undefined);
          throw err;
        }
      } catch (err) {
        this.markPersistenceError('reconnection', err);
        return false;
      }
    })().finally(() => {
      this.recoveryPromise = undefined;
    });

    return this.recoveryPromise;
  }

  public async ensureAvailable(): Promise<boolean> {
    if (!MONGODB_URI) return true;
    if (!this.persistenceError && this.mongoDb) return true;
    if (!(await this.recoverMongoConnection())) return false;
    if (this.pendingCollections.size > 0) {
      this.enqueuePendingPersistence();
      await this.persistQueue;
    }
    return !this.persistenceError;
  }

  private async replaceMongoCollection(key: StateCollection, documents: PersistedDocument[]): Promise<void> {
    if (!this.mongoDb) throw new Error('MongoDB has not been initialized.');
    const collection: Collection<MongoStoredDocument> = this.mongoDb.collection(MONGO_COLLECTION_NAMES[key]);
    const safeDocuments = key === 'recommendations'
      ? this.normalizeRecommendations(documents as unknown as Recommendation[], 'persist recommendations') as unknown as PersistedDocument[]
      : documents;
    const ids = safeDocuments.map(document => document.id);
    if (new Set(ids).size !== ids.length) {
      const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.error('MongoDB recommendation validation failed', JSON.stringify({
        operation: 'persist recommendations',
        numberOfRecommendations: safeDocuments.length,
        duplicateIdsDetected: [...new Set(duplicateIds)],
        recommendationStableIds: safeDocuments.map(document => document.id),
        recommendationTopics: safeDocuments.map(document => String(document.topic ?? 'unknown')),
        recommendationTypes: safeDocuments.map(document => String(document.performanceLevel ?? 'unknown'))
      }));
      throw new PersistenceDataError(`Cannot persist ${MONGO_COLLECTION_NAMES[key]} because duplicate stable IDs were detected.`);
    }

    if (safeDocuments.length > 0) {
      await collection.bulkWrite(safeDocuments.map(document => ({
        replaceOne: {
          filter: { _id: document.id },
          replacement: { _id: document.id, ...document },
          upsert: true
        }
      })), { ordered: false });
    }
    await collection.deleteMany(ids.length > 0 ? { _id: { $nin: ids } } : {});
  }

  private persistToLocalFile() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
  }

  public async flush() {
    await this.persistQueue;
    if (this.persistenceError) {
      throw new Error('MongoDB persistence is unavailable. The request was not confirmed as saved.');
    }
  }

  public async close() {
    await this.flush();
    await this.mongoClient?.close();
  }

  // --- User Operations ---
  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(id: string) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  public createUser(userData: { name: string; email: string; password: string; status?: 'ACTIVE' | 'PENDING' }) {
    const existing = this.findUserByEmail(userData.email);
    if (existing) throw new Error('A user with this email address already exists.');

    const passwordHash = bcrypt.hashSync(userData.password, 10);
    const newUser: User & { passwordHash: string } = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name: userData.name,
      email: userData.email,
      role: 'USER',
      status: userData.status || 'ACTIVE',
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.users.push(newUser);
    this.persist('users');

    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  }

  public verifyCredentials(email: string, password: string) {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    if (user.status !== 'ACTIVE') return null;
    const valid = bcrypt.compareSync(password, user.passwordHash);
    if (!valid) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  public getAllUsers() {
    return this.data.users.map(({ passwordHash, ...u }) => u);
  }

  public createAdminRequest(userId: string): AdminRequest {
    const user = this.data.users.find(candidate => candidate.id === userId);
    if (!user) throw new Error('User not found.');
    const existingPending = this.data.adminRequests.find(request => request.userId === userId && request.type === 'ADMIN_REGISTRATION' && request.status === 'PENDING');
    if (existingPending) return existingPending;
    const request: AdminRequest = {
      id: 'admin-request-' + Math.random().toString(36).substring(2, 9),
      userId,
      name: user.name,
      email: user.email,
      type: 'ADMIN_REGISTRATION',
      requestedRole: 'ADMIN',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    this.data.adminRequests.push(request);
    this.addAuditLog({ actorId: userId, actorRole: user.role, action: 'ADMIN_REGISTRATION_REQUESTED', targetUserId: userId, targetRole: user.role, requestId: request.id });
    this.persist('adminRequests', 'auditLogs');
    return request;
  }

  public getAdminRequests(): AdminRequest[] {
    return [...this.data.adminRequests]
      .filter(request => request.type === 'ADMIN_REGISTRATION')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAdminRequestForUser(userId: string): AdminRequest | undefined {
    return this.getAdminRequests().find(request => request.userId === userId);
  }

  public reviewAdminRequest(requestId: string, reviewerId: string, approve: boolean, reason?: string): AdminRequest | null {
    const request = this.data.adminRequests.find(candidate => candidate.id === requestId);
    if (!request || request.status !== 'PENDING') return null;
    const user = this.data.users.find(candidate => candidate.id === request.userId);
    if (!user) return null;
    const now = new Date().toISOString();
    request.status = approve ? 'APPROVED' : 'REJECTED';
    request.reviewedAt = now;
    request.reviewedBy = reviewerId;
    request.reason = reason?.trim() || undefined;
    if (approve) {
      user.role = 'ADMIN';
      user.updatedAt = now;
      this.addAuditLog({ actorId: reviewerId, actorRole: 'SUPER_ADMIN', action: 'ROLE_CHANGED', targetUserId: user.id, targetRole: 'ADMIN', requestId: request.id, reason: 'USER to ADMIN' });
    }
    this.addAuditLog({
      actorId: reviewerId,
      actorRole: 'SUPER_ADMIN',
      action: approve ? 'ADMIN_REGISTRATION_APPROVED' : 'ADMIN_REGISTRATION_REJECTED',
      targetUserId: user.id,
      targetRole: user.role,
      requestId: request.id,
      reason: request.reason
    });
    this.persist('users', 'adminRequests', 'auditLogs');
    return request;
  }

  public createStudentRegistrationRequest(userId: string): AdminRequest {
    const user = this.data.users.find(candidate => candidate.id === userId);
    if (!user) throw new Error('User not found.');
    const request: AdminRequest = {
      id: 'student-request-' + Math.random().toString(36).substring(2, 9),
      userId,
      name: user.name,
      email: user.email,
      type: 'STUDENT_REGISTRATION',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    this.data.adminRequests.push(request);
    this.addAuditLog({ actorId: userId, actorRole: user.role, action: 'STUDENT_REGISTRATION_REQUESTED', targetUserId: userId, targetRole: user.role, requestId: request.id });
    this.persist('adminRequests', 'auditLogs');
    return request;
  }

  public getRequests(type?: AdminRequest['type']): AdminRequest[] {
    return [...this.data.adminRequests]
      .filter(request => !type || request.type === type)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getRequestForUser(userId: string, type?: AdminRequest['type']): AdminRequest | undefined {
    return this.getRequests(type).find(request => request.userId === userId);
  }

  public reviewStudentRegistration(requestId: string, reviewerId: string, approve: boolean, reason?: string): AdminRequest | null {
    return this.reviewRequest(requestId, reviewerId, approve, reason, 'STUDENT_REGISTRATION');
  }

  public requestPasswordReset(email: string): AdminRequest | null {
    const user = this.findUserByEmail(email);
    if (!user || user.status === 'REJECTED') return null;
    const existingPending = this.data.adminRequests.find(request => request.userId === user.id && request.type === 'PASSWORD_RESET' && request.status === 'PENDING');
    if (existingPending) return existingPending;
    const request: AdminRequest = {
      id: 'password-request-' + Math.random().toString(36).substring(2, 9),
      userId: user.id,
      name: user.name,
      email: user.email,
      type: 'PASSWORD_RESET',
      role: user.role,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };
    this.data.adminRequests.push(request);
    this.addAuditLog({ actorId: user.id, actorRole: user.role, action: 'PASSWORD_RESET_REQUESTED', targetUserId: user.id, targetRole: user.role, requestId: request.id });
    this.persist('adminRequests', 'auditLogs');
    return request;
  }

  public reviewPasswordReset(requestId: string, reviewerId: string, approve: boolean, reason?: string): AdminRequest | null {
    const request = this.data.adminRequests.find(candidate => candidate.id === requestId && candidate.type === 'PASSWORD_RESET');
    if (!request || request.status !== 'PENDING') return null;
    if (request.userId === reviewerId) throw new Error('You cannot review your own password reset request.');
    if (!approve) return this.reviewRequest(requestId, reviewerId, false, reason, 'PASSWORD_RESET');
    const token = crypto.randomBytes(32).toString('hex');
    const reviewed = this.reviewRequest(requestId, reviewerId, true, reason, 'PASSWORD_RESET');
    if (!reviewed) return null;
    reviewed.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    reviewed.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    reviewed.resetTokenUsedAt = undefined;
    this.persist('users', 'adminRequests', 'auditLogs');
    return { ...reviewed, reason: token };
  }

  public completePasswordReset(token: string, newPassword: string): boolean {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const request = this.data.adminRequests.find(candidate => candidate.type === 'PASSWORD_RESET' && candidate.status === 'APPROVED' && candidate.resetTokenHash === tokenHash && !candidate.resetTokenUsedAt && candidate.resetTokenExpiresAt && new Date(candidate.resetTokenExpiresAt).getTime() > Date.now());
    if (!request) return false;
    const user = this.data.users.find(candidate => candidate.id === request.userId);
    if (!user) return false;
    user.passwordHash = bcrypt.hashSync(newPassword, 10);
    user.updatedAt = new Date().toISOString();
    request.resetTokenUsedAt = new Date().toISOString();
    this.addAuditLog({ actorId: user.id, actorRole: user.role, action: 'PASSWORD_RESET_COMPLETED', targetUserId: user.id, targetRole: user.role, requestId: request.id });
    this.persist('users', 'adminRequests', 'auditLogs');
    return true;
  }

  public setUserStatus(userId: string, actorId: string, suspended: boolean): User | null {
    const user = this.data.users.find(candidate => candidate.id === userId);
    if (!user || user.id === actorId || user.role === 'SUPER_ADMIN') return null;
    user.status = suspended ? 'SUSPENDED' : 'ACTIVE';
    user.updatedAt = new Date().toISOString();
    this.addAuditLog({ actorId, actorRole: 'SUPER_ADMIN', action: suspended ? (user.role === 'ADMIN' ? 'ADMIN_SUSPENDED' : 'USER_SUSPENDED') : (user.role === 'ADMIN' ? 'ADMIN_UNSUSPENDED' : 'USER_UNSUSPENDED'), targetUserId: user.id, targetRole: user.role });
    this.persist('users', 'adminRequests', 'auditLogs');
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  private reviewRequest(requestId: string, reviewerId: string, approve: boolean, reason: string | undefined, type: AdminRequest['type']): AdminRequest | null {
    const request = this.data.adminRequests.find(candidate => candidate.id === requestId && candidate.type === type);
    if (!request || request.status !== 'PENDING') return null;
    const user = this.data.users.find(candidate => candidate.id === request.userId);
    if (!user) return null;
    const now = new Date().toISOString();
    request.status = approve ? 'APPROVED' : 'REJECTED';
    request.reviewedAt = now;
    request.reviewedBy = reviewerId;
    request.reason = reason?.trim() || undefined;
    if (type === 'STUDENT_REGISTRATION') user.status = approve ? 'ACTIVE' : 'REJECTED';
    this.addAuditLog({ actorId: reviewerId, actorRole: 'SUPER_ADMIN', action: type === 'STUDENT_REGISTRATION' ? (approve ? 'STUDENT_REGISTRATION_APPROVED' : 'STUDENT_REGISTRATION_REJECTED') : (approve ? 'PASSWORD_RESET_APPROVED' : 'PASSWORD_RESET_REJECTED'), targetUserId: user.id, targetRole: user.role, requestId: request.id, reason: request.reason });
    this.persist('users', 'adminRequests', 'auditLogs');
    return request;
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public recordAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    this.addAuditLog(log);
    this.persist('auditLogs');
  }

  private addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    this.data.auditLogs.push({ ...log, id: 'audit-' + Math.random().toString(36).substring(2, 9), timestamp: new Date().toISOString() });
  }

  // --- Subject Operations ---
  public getExams(): Exam[] {
    return this.data.exams;
  }

  public getSubjects(): Subject[] {
    return this.data.subjects;
  }

  public getSubjectById(id: string): Subject | undefined {
    return this.data.subjects.find(s => s.id === id);
  }

  public createSubject(sub: { examId: string; name: string; description: string; icon?: string }): Subject {
    const newSub: Subject = {
      id: 'subj-' + Math.random().toString(36).substring(2, 9),
      examId: sub.examId,
      name: sub.name,
      description: sub.description,
      icon: sub.icon || 'BookOpen',
      createdAt: new Date().toISOString()
    };
    this.data.subjects.push(newSub);
    this.persist('subjects');
    return newSub;
  }

  public updateSubject(id: string, updates: Partial<Subject>): Subject | null {
    const idx = this.data.subjects.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.subjects[idx] = { ...this.data.subjects[idx], ...updates };
    this.persist('subjects');
    return this.data.subjects[idx];
  }

  public deleteSubject(id: string): boolean {
    const prevLen = this.data.subjects.length;
    this.data.subjects = this.data.subjects.filter(s => s.id !== id);
    if (this.data.subjects.length !== prevLen) {
      // Cascade delete topics and questions for this subject
      this.data.topics = this.data.topics.filter(t => t.subjectId !== id);
      this.data.questions = this.data.questions.filter(q => q.subjectId !== id);
      this.persist('subjects', 'topics', 'questions');
      return true;
    }
    return false;
  }

  // --- Topic Operations ---
  public getTopics(subjectId?: string): Topic[] {
    if (subjectId) {
      return this.data.topics.filter(t => t.subjectId === subjectId);
    }
    return this.data.topics;
  }

  public getTopicById(id: string): Topic | undefined {
    return this.data.topics.find(t => t.id === id);
  }

  public createTopic(topic: { subjectId: string; name: string; description: string }): Topic {
    const newTopic: Topic = {
      id: 'top-' + Math.random().toString(36).substring(2, 9),
      subjectId: topic.subjectId,
      name: topic.name,
      description: topic.description,
      createdAt: new Date().toISOString()
    };
    this.data.topics.push(newTopic);
    this.persist('topics');
    return newTopic;
  }

  public updateTopic(id: string, updates: Partial<Topic>): Topic | null {
    const idx = this.data.topics.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.topics[idx] = { ...this.data.topics[idx], ...updates };
    this.persist('topics');
    return this.data.topics[idx];
  }

  public deleteTopic(id: string): boolean {
    const prevLen = this.data.topics.length;
    this.data.topics = this.data.topics.filter(t => t.id !== id);
    if (this.data.topics.length !== prevLen) {
      this.data.questions = this.data.questions.filter(q => q.topicId !== id);
      this.persist('topics', 'questions');
      return true;
    }
    return false;
  }

  // --- Question Operations ---
  public getQuestions(filters?: { subjectId?: string; topicId?: string; difficulty?: string }): Question[] {
    let result = [...this.data.questions];
    if (filters?.subjectId) {
      result = result.filter(q => q.subjectId === filters.subjectId);
    }
    if (filters?.topicId) {
      result = result.filter(q => q.topicId === filters.topicId);
    }
    if (filters?.difficulty) {
      result = result.filter(q => q.difficulty.toLowerCase() === filters.difficulty?.toLowerCase());
    }
    return result;
  }

  public getQuestionById(id: string): Question | undefined {
    return this.data.questions.find(q => q.id === id);
  }

  public createQuestion(q: Omit<Question, 'id' | 'createdAt'>): Question {
    const newQ: Question = {
      id: 'q-' + Math.random().toString(36).substring(2, 9),
      ...q,
      createdAt: new Date().toISOString()
    };
    this.data.questions.push(newQ);
    this.persist('questions');
    return newQ;
  }

  public updateQuestion(id: string, updates: Partial<Question>): Question | null {
    const idx = this.data.questions.findIndex(q => q.id === id);
    if (idx === -1) return null;
    this.data.questions[idx] = { ...this.data.questions[idx], ...updates };
    this.persist('questions');
    return this.data.questions[idx];
  }

  public deleteQuestion(id: string): boolean {
    const prevLen = this.data.questions.length;
    this.data.questions = this.data.questions.filter(q => q.id !== id);
    if (this.data.questions.length !== prevLen) {
      this.persist('questions');
      return true;
    }
    return false;
  }

  // --- Test Operations ---
  public getTests(): Test[] {
    return this.data.tests;
  }

  public getTestById(id: string): Test | undefined {
    return this.data.tests.find(t => t.id === id);
  }

  public createTest(test: Omit<Test, 'id' | 'createdAt'>): Test {
    const newTest: Test = {
      id: 'test-' + Math.random().toString(36).substring(2, 9),
      ...test,
      createdAt: new Date().toISOString()
    };
    this.data.tests.push(newTest);
    this.persist('tests');
    return newTest;
  }

  // --- Test Attempt & Question Attempt Operations ---
  public saveTestAttempt(attempt: Omit<TestAttempt, 'id' | 'createdAt'>): TestAttempt {
    const newAttempt: TestAttempt = {
      id: 'att-' + Math.random().toString(36).substring(2, 9),
      ...attempt,
      createdAt: new Date().toISOString()
    };
    this.data.testAttempts.push(newAttempt);

    if (attempt.questionAttempts && attempt.questionAttempts.length > 0) {
      for (const qa of attempt.questionAttempts) {
        this.data.questionAttempts.push({
          ...qa,
          id: qa.id || ('qa-' + Math.random().toString(36).substring(2, 9)),
          studentId: attempt.studentId,
          createdAt: new Date().toISOString()
        });
      }
    }

    this.persist('testAttempts', 'questionAttempts');
    return newAttempt;
  }

  public getStudentAttempts(studentId: string): TestAttempt[] {
    return this.data.testAttempts
      .filter(a => a.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllAttempts(): TestAttempt[] {
    return [...this.data.testAttempts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAttemptById(attemptId: string): TestAttempt | undefined {
    return this.data.testAttempts.find(attempt => attempt.id === attemptId);
  }

  public getUsersByRole(role?: User['role']): User[] {
    return this.data.users
      .filter(user => !role || user.role === role)
      .map(({ passwordHash, ...user }) => user);
  }

  public updateTestStatus(testId: string, status: 'ACTIVE' | 'INACTIVE'): Test | null {
    const test = this.data.tests.find(candidate => candidate.id === testId);
    if (!test) return null;
    test.status = status;
    this.persist('tests');
    return test;
  }

  public getStudentQuestionAttempts(studentId: string): QuestionAttempt[] {
    return this.data.questionAttempts.filter(qa => qa.studentId === studentId);
  }

  // --- Recommendations ---
  public saveRecommendations(recs: Recommendation[]) {
    // Replace old recommendations for this student
    if (recs.length === 0) return;
    const normalizedRecommendations = this.normalizeRecommendations(recs, 'prepare recommendations');
    if (normalizedRecommendations.length === 0) return;
    const studentId = normalizedRecommendations[0].studentId;
    this.data.recommendations = this.data.recommendations.filter(r => r.studentId !== studentId);
    this.data.recommendations.push(...normalizedRecommendations);
    this.persist('recommendations');
  }

  public getStudentRecommendations(studentId: string): Recommendation[] {
    return this.data.recommendations.filter(r => r.studentId === studentId);
  }

  // --- Seed Realistic Demo Performance Records ---
  public seedDemoStudentPerformance(studentId: string) {
    // Specifically implements the benchmark viva requirement:
    // DBMS:
    // SQL JOIN = 88% (Strong)
    // Normalization = 42% (Weak)
    // Transactions = 55% (Moderate)
    // Indexing = 84% (Strong)

    // Clear existing records for this student first to provide a clean demonstration
    this.data.testAttempts = this.data.testAttempts.filter(a => a.studentId !== studentId);
    this.data.questionAttempts = this.data.questionAttempts.filter(qa => qa.studentId !== studentId);

    const now = Date.now();
    const mockQuestionAttempts: QuestionAttempt[] = [];

    // Helper to generate attempts matching exact percentages
    const generateAttempts = (topicId: string, topicName: string, accuracyPercent: number, count: number, avgTime: number) => {
      const correctCount = Math.round((accuracyPercent / 100) * count);
      for (let i = 0; i < count; i++) {
        const isCorrect = i < correctCount;
        const timeVar = avgTime + (Math.random() * 8 - 4);
        mockQuestionAttempts.push({
          id: `qa-demo-${topicId}-${i}`,
          studentId,
          questionId: `q-${topicId}-${i}`,
          topicId,
          selectedAnswer: isCorrect ? 0 : 2,
          correct: isCorrect,
          responseTime: Math.max(12, Math.round(timeVar)),
          difficulty: isCorrect ? 'Medium' : 'Easy',
          createdAt: new Date(now - (count - i) * 3600 * 1000).toISOString()
        });
      }
    };

    // Normalization: 42% accuracy (e.g. 5 of 12 correct) -> WEAK
    generateAttempts('top-dbms-norm', 'Normalization', 41.7, 12, 54);

    // SQL JOIN: 88% accuracy (e.g. 7 of 8 correct) -> STRONG
    generateAttempts('top-dbms-join', 'SQL JOIN', 87.5, 8, 28);

    // Transactions: 55% accuracy (e.g. 5 of 9 correct) -> MODERATE
    generateAttempts('top-dbms-tx', 'Transactions', 55.5, 9, 39);

    // Indexing: 84% accuracy (e.g. 5 of 6 correct) -> STRONG
    generateAttempts('top-dbms-idx', 'Indexing', 83.3, 6, 32);

    // Trees (DSA): 60% accuracy -> MODERATE
    generateAttempts('top-dsa-trees', 'Binary Trees & BST', 60.0, 10, 42);

    // Process Synchronization (OS): 33% accuracy -> WEAK
    generateAttempts('top-os-sync', 'Process Synchronization', 33.3, 9, 58);

    this.data.questionAttempts.push(...mockQuestionAttempts);

    // Create 3 historical test attempts
    this.data.testAttempts.push(
      {
        id: 'att-demo-1',
        studentId,
        testId: 'test-dbms-mock-1',
        title: 'DBMS Comprehensive Assessment Mock Test',
        subjectId: 'subj-dbms',
        score: 65,
        totalQuestions: 20,
        correctAnswers: 13,
        incorrectAnswers: 6,
        unattempted: 1,
        accuracy: 65,
        timeTaken: 580,
        createdAt: new Date(now - 86400 * 1000 * 3).toISOString()
      },
      {
        id: 'att-demo-2',
        studentId,
        testId: 'test-dbms-mock-1',
        title: 'DBMS Diagnostic Quiz #2',
        subjectId: 'subj-dbms',
        score: 72,
        totalQuestions: 18,
        correctAnswers: 13,
        incorrectAnswers: 5,
        unattempted: 0,
        accuracy: 72.2,
        timeTaken: 510,
        createdAt: new Date(now - 86400 * 1000 * 1).toISOString()
      }
    );

    this.persist('testAttempts', 'questionAttempts');
    return {
      success: true,
      message: 'Demo performance records successfully injected for student.',
      totalAttemptsCreated: mockQuestionAttempts.length
    };
  }

  public resetAllData() {
    this.seedInitialData();
  }
}

export const db = new DatabaseService();
