import { Router } from 'express';
import * as authCtrl from '../controllers/authController';
import * as subCtrl from '../controllers/subjectController';
import * as topCtrl from '../controllers/topicController';
import * as qCtrl from '../controllers/questionController';
import * as testCtrl from '../controllers/testController';
import * as perfCtrl from '../controllers/performanceController';
import * as recCtrl from '../controllers/recommendationController';
import * as aiCtrl from '../controllers/aiExplainerController';
import * as superAdminCtrl from '../controllers/superAdminController';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../middleware/authMiddleware';

const router = Router();

// --- Auth Routes ---
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.post('/auth/password-reset-requests', authCtrl.requestPasswordReset);
router.get('/auth/password-reset-requests/me', authenticateToken, authCtrl.getMyPasswordResetRequest);
router.post('/auth/password-reset', authCtrl.completePasswordReset);
router.get('/auth/profile', authenticateToken, authCtrl.getProfile);
router.get('/auth/students', authenticateToken, requireAdmin, authCtrl.getAllStudents);
router.post('/admin-requests', authenticateToken, authCtrl.submitAdminRequest);
router.get('/admin-requests/me', authenticateToken, authCtrl.getMyAdminRequest);
router.get('/admin-requests', authenticateToken, requireSuperAdmin, authCtrl.getAdminRequests);
router.put('/admin-requests/:id/:action', authenticateToken, requireSuperAdmin, authCtrl.reviewAdminRequest);
router.get('/super-admin/registration-requests', authenticateToken, requireSuperAdmin, authCtrl.getStudentRegistrationRequests);
router.post('/super-admin/registration-requests/:id/:action', authenticateToken, requireSuperAdmin, authCtrl.reviewStudentRegistration);
router.get('/super-admin/password-reset-requests', authenticateToken, requireSuperAdmin, authCtrl.getPasswordResetRequests);
router.post('/super-admin/password-reset-requests/:id/:action', authenticateToken, requireSuperAdmin, authCtrl.reviewPasswordReset);
router.get('/super-admin/audit-logs', authenticateToken, requireSuperAdmin, authCtrl.getAuditLogs);
router.post('/super-admin/users/:id/:action', authenticateToken, requireSuperAdmin, authCtrl.updateUserSuspension);
router.get('/super-admin/dashboard', authenticateToken, requireSuperAdmin, superAdminCtrl.getDashboard);
router.get('/super-admin/students', authenticateToken, requireSuperAdmin, superAdminCtrl.getStudents);
router.get('/super-admin/students/:id', authenticateToken, requireSuperAdmin, superAdminCtrl.getStudentDetails);
router.get('/super-admin/students/:id/attempts', authenticateToken, requireSuperAdmin, superAdminCtrl.getStudentAttempts);
router.get('/super-admin/students/:id/attempts/:attemptId', authenticateToken, requireSuperAdmin, superAdminCtrl.getAttemptDetails);
router.get('/super-admin/analytics', authenticateToken, requireSuperAdmin, superAdminCtrl.getAnalytics);
router.get('/super-admin/mock-tests', authenticateToken, requireSuperAdmin, superAdminCtrl.getMockTests);
router.get('/super-admin/mock-tests/:id/analytics', authenticateToken, requireSuperAdmin, superAdminCtrl.getMockTestAnalytics);
router.put('/super-admin/mock-tests/:id/status', authenticateToken, requireSuperAdmin, superAdminCtrl.updateMockTestStatus);

// --- Subject Routes ---
router.get('/subjects', subCtrl.getSubjects);
router.get('/exams', subCtrl.getExams);
router.get('/subjects/:id', subCtrl.getSubjectById);
router.post('/subjects', authenticateToken, requireAdmin, subCtrl.createSubject);
router.put('/subjects/:id', authenticateToken, requireAdmin, subCtrl.updateSubject);
router.delete('/subjects/:id', authenticateToken, requireAdmin, subCtrl.deleteSubject);

// --- Topic Routes ---
router.get('/topics', topCtrl.getTopics);
router.get('/topics/:subjectId', topCtrl.getTopicsBySubject);
router.post('/topics', authenticateToken, requireAdmin, topCtrl.createTopic);
router.put('/topics/:id', authenticateToken, requireAdmin, topCtrl.updateTopic);
router.delete('/topics/:id', authenticateToken, requireAdmin, topCtrl.deleteTopic);

// --- Question Routes ---
router.get('/questions', qCtrl.getQuestions);
router.get('/questions/:id', qCtrl.getQuestionById);
router.post('/questions', authenticateToken, requireAdmin, qCtrl.createQuestion);
router.put('/questions/:id', authenticateToken, requireAdmin, qCtrl.updateQuestion);
router.delete('/questions/:id', authenticateToken, requireAdmin, qCtrl.deleteQuestion);

// --- Test & Quiz Routes ---
router.get('/tests', authenticateToken, testCtrl.getTests);
router.get('/tests/history', authenticateToken, testCtrl.getStudentHistory);
router.get('/tests/:id', authenticateToken, testCtrl.getTestById);
router.post('/tests', authenticateToken, requireAdmin, testCtrl.createTest);
router.post('/tests/start', authenticateToken, testCtrl.startPracticeSession);
router.post('/tests/submit', authenticateToken, testCtrl.submitTestAttempt);

// --- Performance Routes ---
router.get('/performance/:studentId', authenticateToken, perfCtrl.getStudentPerformance);
router.get('/performance/:studentId/topics', authenticateToken, perfCtrl.getTopicPerformance);
router.post('/performance/seed-demo', authenticateToken, perfCtrl.seedDemoPerformance);

// --- Recommendation Routes ---
router.get('/recommendations/:studentId', authenticateToken, recCtrl.getStudentRecommendations);
router.post('/recommendations/analyze', authenticateToken, recCtrl.triggerAnalysis);

// --- AI Explainer Routes ---
router.post('/ai/explain', authenticateToken, aiCtrl.explainConcept);
router.post('/ai/hint', authenticateToken, aiCtrl.getQuestionHint);

export default router;
