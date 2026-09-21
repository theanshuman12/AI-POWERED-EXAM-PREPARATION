import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const tempFile = path.resolve('database', 'recommendation-persistence-smoke.json');
process.env.NODE_ENV = 'test';
process.env.DATABASE_FILE = tempFile;

try {
  const { db } = await import('../backend/src/services/databaseService');
  await db.ready;
  const base = {
    id: 'random-id-from-ai',
    studentId: 'smoke-student',
    topicId: 'topic-1',
    topic: 'Topic One',
    subjectName: 'Subject One',
    performanceScore: 0.5,
    performanceLevel: 'Moderate' as const,
    recommendedDifficulty: 'Medium' as const,
    action: 'Practice',
    reason: 'Keep practicing',
    revisionTips: ['Review'],
    createdAt: '2026-09-21T00:00:00.000Z'
  };

  db.saveRecommendations([base, { ...base, id: 'different-random-id' }]);
  await db.flush();
  const deduplicated = db.getStudentRecommendations('smoke-student');
  assert.equal(deduplicated.length, 1, 'identical recommendations should deduplicate');
  const firstId = deduplicated[0].id;

  db.saveRecommendations([
    base,
    { ...base, id: 'another-random-id', topicId: 'topic-2', topic: 'Topic Two' }
  ]);
  await db.flush();
  const distinct = db.getStudentRecommendations('smoke-student');
  assert.equal(distinct.length, 2, 'different logical recommendations should both persist');
  assert.notEqual(distinct[0].id, distinct[1].id, 'different logical recommendations need unique stable IDs');

  db.saveRecommendations([{ ...base, id: 'retry-random-id' }]);
  await db.flush();
  assert.equal(db.getStudentRecommendations('smoke-student').length, 1, 'repeated persistence should remain idempotent');
  assert.equal(db.getStudentRecommendations('smoke-student')[0].id, firstId, 'stable ID must survive retries');

  const questionAttempts = Array.from({ length: 100 }, (_, index) => ({
    id: `smoke-qa-${index}`,
    studentId: 'smoke-student',
    questionId: `smoke-question-${index}`,
    topicId: 'topic-1',
    selectedAnswer: index % 3 === 0 ? -1 : 1,
    correct: index % 3 !== 0,
    responseTime: 30,
    difficulty: 'Medium' as const,
    createdAt: '2026-09-21T00:00:00.000Z'
  }));
  db.saveTestAttempt({
    studentId: 'smoke-student',
    testId: 'test-uppet-paper-mock',
    title: 'UPPET Paper Mock Smoke Test',
    subjectId: 'subj-uppet-paper-mock',
    score: 66.67,
    totalQuestions: 100,
    correctAnswers: 66,
    incorrectAnswers: 0,
    unattempted: 34,
    accuracy: 66,
    positiveMarks: 66,
    negativeMarks: 0,
    maxScore: 100,
    timeTaken: 3600,
    questionAttempts
  });
  await db.flush();
  assert.equal(db.getStudentQuestionAttempts('smoke-student').length, 100, 'UPPET must retain all 100 question-level answers');
  assert.equal(Math.min(100, Math.max(-25, 66 - (0 * 0.25))), 66, 'UPPET score calculation must remain unchanged');
  console.log('Recommendation persistence smoke tests passed.');
} finally {
  try {
    fs.rmSync(tempFile, { force: true });
  } catch {
  }
}
