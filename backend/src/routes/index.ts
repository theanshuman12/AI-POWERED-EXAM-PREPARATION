import { Router } from 'express';
import * as authCtrl from '../controllers/authController';
import * as subCtrl from '../controllers/subjectController';
import * as topCtrl from '../controllers/topicController';
import * as qCtrl from '../controllers/questionController';
import * as testCtrl from '../controllers/testController';
import * as perfCtrl from '../controllers/performanceController';
import * as recCtrl from '../controllers/recommendationController';
import * as aiCtrl from '../controllers/aiExplainerController';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

// --- Auth Routes ---
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/profile', authenticateToken, authCtrl.getProfile);
router.get('/auth/students', authenticateToken, requireAdmin, authCtrl.getAllStudents);

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
