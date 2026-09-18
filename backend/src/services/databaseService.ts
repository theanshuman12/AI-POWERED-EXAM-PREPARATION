import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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
  UPPET_GENERAL_STUDIES_TESTS
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

const DB_DIR = path.resolve(process.cwd(), 'database');
const DB_FILE = path.join(DB_DIR, 'storage.json');

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

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
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
      questions: [...INITIAL_QUESTIONS, ...UPPET_REASONING_QUESTIONS, ...UPPET_GENERAL_STUDIES_QUESTIONS],
      tests: [...INITIAL_TESTS, ...UPPET_REASONING_TESTS, ...UPPET_GENERAL_STUDIES_TESTS],
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

    if (changed) this.persist();
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
      if (!this.data.subjects.some(existing => existing.id === subject.id)) {
        this.data.subjects.push(subject);
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
    if (changed) this.persist();
  }

  public persist() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error persisting database:', err);
    }
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
    this.persist();

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
    this.persist();
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
    this.persist();
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
    this.persist();
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
    this.persist();
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
    this.persist();
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
    this.persist();
    return true;
  }

  public setUserStatus(userId: string, actorId: string, suspended: boolean): User | null {
    const user = this.data.users.find(candidate => candidate.id === userId);
    if (!user || user.id === actorId || user.role === 'SUPER_ADMIN') return null;
    user.status = suspended ? 'SUSPENDED' : 'ACTIVE';
    user.updatedAt = new Date().toISOString();
    this.addAuditLog({ actorId, actorRole: 'SUPER_ADMIN', action: suspended ? (user.role === 'ADMIN' ? 'ADMIN_SUSPENDED' : 'USER_SUSPENDED') : (user.role === 'ADMIN' ? 'ADMIN_UNSUSPENDED' : 'USER_UNSUSPENDED'), targetUserId: user.id, targetRole: user.role });
    this.persist();
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
    this.persist();
    return request;
  }

  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
    this.persist();
    return newSub;
  }

  public updateSubject(id: string, updates: Partial<Subject>): Subject | null {
    const idx = this.data.subjects.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.subjects[idx] = { ...this.data.subjects[idx], ...updates };
    this.persist();
    return this.data.subjects[idx];
  }

  public deleteSubject(id: string): boolean {
    const prevLen = this.data.subjects.length;
    this.data.subjects = this.data.subjects.filter(s => s.id !== id);
    if (this.data.subjects.length !== prevLen) {
      // Cascade delete topics and questions for this subject
      this.data.topics = this.data.topics.filter(t => t.subjectId !== id);
      this.data.questions = this.data.questions.filter(q => q.subjectId !== id);
      this.persist();
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
    this.persist();
    return newTopic;
  }

  public updateTopic(id: string, updates: Partial<Topic>): Topic | null {
    const idx = this.data.topics.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.topics[idx] = { ...this.data.topics[idx], ...updates };
    this.persist();
    return this.data.topics[idx];
  }

  public deleteTopic(id: string): boolean {
    const prevLen = this.data.topics.length;
    this.data.topics = this.data.topics.filter(t => t.id !== id);
    if (this.data.topics.length !== prevLen) {
      this.data.questions = this.data.questions.filter(q => q.topicId !== id);
      this.persist();
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
    this.persist();
    return newQ;
  }

  public updateQuestion(id: string, updates: Partial<Question>): Question | null {
    const idx = this.data.questions.findIndex(q => q.id === id);
    if (idx === -1) return null;
    this.data.questions[idx] = { ...this.data.questions[idx], ...updates };
    this.persist();
    return this.data.questions[idx];
  }

  public deleteQuestion(id: string): boolean {
    const prevLen = this.data.questions.length;
    this.data.questions = this.data.questions.filter(q => q.id !== id);
    if (this.data.questions.length !== prevLen) {
      this.persist();
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
    this.persist();
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

    this.persist();
    return newAttempt;
  }

  public getStudentAttempts(studentId: string): TestAttempt[] {
    return this.data.testAttempts
      .filter(a => a.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getStudentQuestionAttempts(studentId: string): QuestionAttempt[] {
    return this.data.questionAttempts.filter(qa => qa.studentId === studentId);
  }

  // --- Recommendations ---
  public saveRecommendations(recs: Recommendation[]) {
    // Replace old recommendations for this student
    if (recs.length === 0) return;
    const studentId = recs[0].studentId;
    this.data.recommendations = this.data.recommendations.filter(r => r.studentId !== studentId);
    this.data.recommendations.push(...recs);
    this.persist();
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

    this.persist();
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
