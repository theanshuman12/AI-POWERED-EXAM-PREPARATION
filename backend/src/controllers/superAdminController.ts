import { Response } from 'express';
import { db } from '../services/databaseService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Role, TestAttempt, User } from '../../types';

const average = (values: number[]) => values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 10) / 10 : 0;

const getAttemptsForUser = (userId: string) => db.getStudentAttempts(userId);

const buildPerformance = (attempts: TestAttempt[]) => {
  const questionCount = attempts.reduce((sum, attempt) => sum + attempt.totalQuestions, 0);
  const correct = attempts.reduce((sum, attempt) => sum + attempt.correctAnswers, 0);
  const incorrect = attempts.reduce((sum, attempt) => sum + attempt.incorrectAnswers, 0);
  const unanswered = attempts.reduce((sum, attempt) => sum + attempt.unattempted, 0);
  return {
    testsAttempted: attempts.length,
    testsCompleted: attempts.length,
    questionsAttempted: questionCount,
    correctAnswers: correct,
    incorrectAnswers: incorrect,
    unanswered,
    totalScore: attempts.reduce((sum, attempt) => sum + attempt.score, 0),
    averageScore: average(attempts.map(attempt => attempt.score)),
    averagePercentage: average(attempts.map(attempt => attempt.score)),
    overallAccuracy: average(attempts.map(attempt => attempt.accuracy)),
    highestScore: attempts.length ? Math.max(...attempts.map(attempt => attempt.score)) : 0,
    lowestScore: attempts.length ? Math.min(...attempts.map(attempt => attempt.score)) : 0,
    averageTimePerTest: average(attempts.map(attempt => attempt.timeTaken)),
    totalTimeSpent: attempts.reduce((sum, attempt) => sum + attempt.timeTaken, 0)
  };
};

const subjectPerformance = (attempts: TestAttempt[]) => {
  const subjects = new Map<string, TestAttempt[]>();
  for (const attempt of attempts) {
    const current = subjects.get(attempt.subjectId) || [];
    current.push(attempt);
    subjects.set(attempt.subjectId, current);
  }
  return [...subjects.entries()].map(([subjectId, subjectAttempts]) => ({
    subjectId,
    subjectName: db.getSubjectById(subjectId)?.name || subjectId,
    tests: subjectAttempts.length,
    completedTests: subjectAttempts.length,
    averageScore: average(subjectAttempts.map(attempt => attempt.score)),
    averagePercentage: average(subjectAttempts.map(attempt => attempt.score)),
    accuracy: average(subjectAttempts.map(attempt => attempt.accuracy)),
    correctAnswers: subjectAttempts.reduce((sum, attempt) => sum + attempt.correctAnswers, 0),
    incorrectAnswers: subjectAttempts.reduce((sum, attempt) => sum + attempt.incorrectAnswers, 0),
    unanswered: subjectAttempts.reduce((sum, attempt) => sum + attempt.unattempted, 0),
    averageTime: average(subjectAttempts.map(attempt => attempt.timeTaken))
  }));
};

const studentSummary = (user: User) => {
  const attempts = getAttemptsForUser(user.id);
  const performance = buildPerformance(attempts);
  return {
    ...user,
    lastActivity: attempts[0]?.createdAt || null,
    testsAttempted: performance.testsAttempted,
    testsCompleted: performance.testsCompleted,
    averageScore: performance.averageScore,
    averageAccuracy: performance.overallAccuracy
  };
};

export const getDashboard = async (req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsers();
  const attempts = db.getAllAttempts();
  const students = users.filter(user => user.role === 'USER');
  const admins = users.filter(user => user.role === 'ADMIN');
  const pendingRequests = db.getRequests().filter(request => request.status === 'PENDING').length;
  const performance = buildPerformance(attempts);
  res.json({
    students: { total: students.length, active: students.filter(user => user.status === 'ACTIVE').length, suspended: students.filter(user => user.status === 'SUSPENDED').length, pending: students.filter(user => user.status === 'PENDING').length },
    admins: { total: admins.length, active: admins.filter(user => user.status === 'ACTIVE').length, suspended: admins.filter(user => user.status === 'SUSPENDED').length },
    totalMockTests: db.getTests().length,
    totalQuestions: db.getQuestions().length,
    totalTestAttempts: attempts.length,
    totalCompletedTests: performance.testsCompleted,
    totalPendingRequests: pendingRequests,
    averagePlatformScore: performance.averageScore,
    averagePlatformAccuracy: performance.overallAccuracy,
    totalQuestionsAnswered: performance.correctAnswers + performance.incorrectAnswers,
    subjectPerformance: subjectPerformance(attempts)
  });
};

export const getStudents = async (req: AuthenticatedRequest, res: Response) => {
  const search = String(req.query.search || '').toLowerCase();
  const status = String(req.query.status || '');
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filtered = db.getUsersByRole('USER').filter(user => {
    const matchesSearch = !search || user.name.toLowerCase().includes(search) || user.email.toLowerCase().includes(search);
    return matchesSearch && (!status || user.status === status);
  });
  const total = filtered.length;
  res.json({ students: filtered.slice((page - 1) * limit, page * limit).map(studentSummary), total, page, limit });
};

export const getStudentDetails = async (req: AuthenticatedRequest, res: Response) => {
  const user = db.findUserById(req.params.id);
  if (!user || user.role !== 'USER') {
    res.status(404).json({ message: 'Student not found.' });
    return;
  }
  const attempts = getAttemptsForUser(user.id);
  db.recordAuditLog({ actorId: req.user!.id, actorRole: 'SUPER_ADMIN', action: 'STUDENT_PROFILE_VIEWED', targetUserId: user.id, targetRole: user.role });
  res.json({
    student: studentSummary(user),
    performance: buildPerformance(attempts),
    subjectPerformance: subjectPerformance(attempts),
    attempts,
    trends: attempts.slice().reverse().map((attempt, index) => ({ index: index + 1, date: attempt.createdAt, score: attempt.score, accuracy: attempt.accuracy }))
  });
};

export const getStudentAttempts = async (req: AuthenticatedRequest, res: Response) => {
  const user = db.findUserById(req.params.id);
  if (!user || user.role !== 'USER') {
    res.status(404).json({ message: 'Student not found.' });
    return;
  }
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const attempts = getAttemptsForUser(user.id);
  res.json({ attempts: attempts.slice((page - 1) * limit, page * limit), total: attempts.length, page, limit });
};

export const getAttemptDetails = async (req: AuthenticatedRequest, res: Response) => {
  const attempt = db.getAttemptById(req.params.attemptId);
  if (!attempt || attempt.studentId !== req.params.id) {
    res.status(404).json({ message: 'Test attempt not found.' });
    return;
  }
  const student = db.findUserById(attempt.studentId);
  const test = attempt.testId ? db.getTestById(attempt.testId) : undefined;
  db.recordAuditLog({ actorId: req.user!.id, actorRole: 'SUPER_ADMIN', action: 'TEST_RESULT_VIEWED', targetUserId: attempt.studentId, targetRole: student?.role || 'USER' });
  const questionDetails = (attempt.questionAttempts || []).map(questionAttempt => {
    const question = db.getQuestionById(questionAttempt.questionId);
    return { ...questionAttempt, question: question?.question || questionAttempt.questionId, options: question?.options || [], correctAnswer: question?.correctAnswer ?? -1 };
  });
  res.json({ student, attempt, test, questionDetails, startedAt: attempt.createdAt, endedAt: new Date(new Date(attempt.createdAt).getTime() + attempt.timeTaken * 1000).toISOString() });
};

export const getAnalytics = async (_req: AuthenticatedRequest, res: Response) => {
  const attempts = db.getAllAttempts();
  res.json({ performance: buildPerformance(attempts), subjectPerformance: subjectPerformance(attempts), students: db.getUsersByRole('USER').map(studentSummary) });
};

export const getMockTests = async (_req: AuthenticatedRequest, res: Response) => {
  const attempts = db.getAllAttempts();
  res.json({ tests: db.getTests().map(test => {
    const testAttempts = attempts.filter(attempt => attempt.testId === test.id);
    return { ...test, status: test.status || 'ACTIVE', totalAttempts: testAttempts.length, averageScore: average(testAttempts.map(attempt => attempt.score)), averageAccuracy: average(testAttempts.map(attempt => attempt.accuracy)) };
  }) });
};

export const getMockTestAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  const test = db.getTestById(req.params.id);
  if (!test) {
    res.status(404).json({ message: 'Mock test not found.' });
    return;
  }
  const attempts = db.getAllAttempts().filter(attempt => attempt.testId === test.id);
  db.recordAuditLog({ actorId: req.user!.id, actorRole: 'SUPER_ADMIN', action: 'MOCK_ANALYTICS_VIEWED', targetUserId: req.user!.id, targetRole: 'SUPER_ADMIN' });
  res.json({ test, performance: buildPerformance(attempts), attempts });
};

export const updateMockTestStatus = async (req: AuthenticatedRequest, res: Response) => {
  if (!['ACTIVE', 'INACTIVE'].includes(req.body?.status)) {
    res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE.' });
    return;
  }
  const test = db.updateTestStatus(req.params.id, req.body.status);
  if (!test) {
    res.status(404).json({ message: 'Mock test not found.' });
    return;
  }
  db.recordAuditLog({ actorId: req.user!.id, actorRole: 'SUPER_ADMIN', action: 'MOCK_STATUS_CHANGED', targetUserId: req.user!.id, targetRole: 'SUPER_ADMIN', reason: req.body.status });
  res.json({ test });
};
