import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { MongoClient } from 'mongodb';

type StateCollection =
  | 'users'
  | 'exams'
  | 'subjects'
  | 'topics'
  | 'questions'
  | 'tests'
  | 'testAttempts'
  | 'questionAttempts'
  | 'recommendations'
  | 'adminRequests'
  | 'auditLogs';

type StorageState = Partial<Record<StateCollection, Array<{ id: string; [key: string]: unknown }>>>;
type MongoDocument = { _id: string; id: string; [key: string]: unknown };

const collectionNames: Record<StateCollection, string> = {
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

const stateCollections = Object.keys(collectionNames) as StateCollection[];
const mongoUri = process.env.MONGODB_URI?.trim();
const databaseFile = process.env.DATABASE_FILE?.trim() || path.resolve(process.cwd(), 'database', 'storage.json');

if (!mongoUri) {
  throw new Error('MONGODB_URI must be configured before running this migration.');
}

if (!fs.existsSync(databaseFile)) {
  throw new Error(`Source database file was not found: ${databaseFile}`);
}

const source = JSON.parse(fs.readFileSync(databaseFile, 'utf-8')) as StorageState;
const client = new MongoClient(mongoUri);

try {
  await client.connect();
  const database = client.db();
  const existingCollection = await Promise.all(stateCollections.map(async key => {
    const hasDocuments = await database.collection(collectionNames[key]).countDocuments({}, { limit: 1 }) > 0;
    return hasDocuments ? collectionNames[key] : null;
  })).then(results => results.find(Boolean));
  const legacyStateExists = await database.collection<{ _id: string }>('application_state').countDocuments({ _id: 'main' }, { limit: 1 }) > 0;

  if (existingCollection || legacyStateExists) {
    const location = existingCollection || 'application_state';
    throw new Error(`MongoDB collection "${location}" already contains data. Migration stopped without changing MongoDB.`);
  }

  await client.withSession(session => session.withTransaction(async () => {
    for (const key of stateCollections) {
      const records = source[key] ?? [];
      const ids = records.map(record => record.id);
      if (ids.some(id => !id) || new Set(ids).size !== ids.length) {
        throw new Error(`Source ${key} contains missing or duplicate IDs. Migration stopped without changes.`);
      }
      if (records.length > 0) {
        await database.collection<MongoDocument>(collectionNames[key]).insertMany(
          records.map(record => ({ ...record, _id: record.id })),
          { session }
        );
      }
    }
  }));

  console.log(`Migrated ${databaseFile} to MongoDB without modifying the source file.`);
} finally {
  await client.close();
}
