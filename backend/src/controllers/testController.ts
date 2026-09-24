import { Response } from 'express';
import crypto from 'crypto';
import { db } from '../services/databaseService';
import { AIService } from '../services/aiService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { QuestionAttempt } from '../../types';

export const getTests = (req: AuthenticatedRequest, res: Response) => {
  const tests = db.getTests();
  res.json(tests);
};

export const getTestById = (req: AuthenticatedRequest, res: Response) => {
  const test = db.getTestById(req.params.id);
  if (!test) {
    res.status(404).json({ message: 'Test not found.' });
    return;
  }
  // Retrieve question details
  const questions = test.questions
    .map(qid => db.getQuestionById(qid))
    .filter(Boolean);

  res.json({ ...test, questionDetails: questions });
};

export const startMockAttempt = (req: AuthenticatedRequest, res: Response) => {
  const test = db.getTestById(req.params.id);
  if (!test) {
    res.status(404).json({ message: 'Test not found.' });
    return;
  }

  const questionDetails = test.questions
    .map(qid => db.getQuestionById(qid))
    .filter(Boolean);

  res.status(201).json({
    attemptId: `att-${crypto.randomUUID()}`,
    title: test.title,
    subjectId: test.subjectId,
    duration: test.duration,
    questionDetails
  });
};

export const createTest = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { title, subjectId, topics, questions, duration, difficulty } = req.body;
    if (!title || !subjectId || !questions || questions.length === 0) {
      res.status(400).json({ message: 'Title, subjectId, and at least one question are required.' });
      return;
    }
    const newTest = db.createTest({
      title,
      subjectId,
      topics: topics || [],
      questions,
      duration: duration || 15,
      difficulty: difficulty || 'Medium'
    });
    await db.flush();
    res.status(201).json(newTest);
  } catch (err: any) {
    res.status(503).json({ message: err.message || 'Unable to save the test.' });
  }
};

export const startPracticeSession = (req: AuthenticatedRequest, res: Response) => {
  const { subjectId, topicId, difficulty, count } = req.body;
  const questions = db.getQuestions({
    subjectId,
    topicId,
    difficulty
  });

  if (questions.length === 0) {
    res.status(404).json({ message: 'No questions available for the selected criteria.' });
    return;
  }

  // Shuffle and limit
  const limit = Math.min(Number(count) || 10, questions.length);
  const shuffled = [...questions].sort(() => 0.5 - Math.random()).slice(0, limit);

  res.json({
    sessionTitle: topicId ? `Practice Session: ${questions[0].topicId}` : 'Topic Practice Session',
    subjectId,
    topicId,
    questions: shuffled,
    duration: Math.max(5, Math.ceil(limit * 1.5))
  });
};

export const submitTestAttempt = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.id || req.body.studentId;
    if (!studentId) {
      res.status(401).json({ message: 'Student ID required.' });
      return;
    }

    const {
      testId,
      attemptId,
      title,
      subjectId,
      answers, // array of { questionId, selectedAnswer, responseTime }
      timeTaken
    } = req.body;

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ message: 'Invalid submission. "answers" array required.' });
      return;
    }

    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unattempted = 0;
    const questionAttempts: QuestionAttempt[] = [];
    const topicBreakdown: Record<string, { total: number; correct: number; name: string }> = {};

    for (const ans of answers) {
      const q = db.getQuestionById(ans.questionId);
      if (!q) continue;

      const isUnattempted = ans.selectedAnswer === undefined || ans.selectedAnswer === null || ans.selectedAnswer === -1;
      const isCorrect = !isUnattempted && ans.selectedAnswer === q.correctAnswer;

      if (isUnattempted) {
        unattempted++;
      } else if (isCorrect) {
        correctAnswers++;
      } else {
        incorrectAnswers++;
      }

      // Track topic breakdown
      const topicObj = db.getTopicById(q.topicId);
      const topicName = topicObj ? topicObj.name : q.topicId;
      if (!topicBreakdown[q.topicId]) {
        topicBreakdown[q.topicId] = { total: 0, correct: 0, name: topicName };
      }
      topicBreakdown[q.topicId].total++;
      if (isCorrect) topicBreakdown[q.topicId].correct++;

      questionAttempts.push({
        id: 'qa-' + Math.random().toString(36).substring(2, 9),
        studentId,
        questionId: q.id,
        topicId: q.topicId,
        selectedAnswer: isUnattempted ? -1 : ans.selectedAnswer,
        correct: isCorrect,
        responseTime: Number(ans.responseTime) || 30,
        difficulty: q.difficulty,
        createdAt: new Date().toISOString()
      });
    }

    const totalQuestions = answers.length;
    const isPaperMock = Boolean(testId && db.getTestById(testId)?.subjectId === 'subj-uppet-paper-mock');
    const positiveMarks = isPaperMock ? correctAnswers : undefined;
    const negativeMarks = isPaperMock ? Math.round(incorrectAnswers * 0.25 * 100) / 100 : undefined;
    const score = isPaperMock
      ? Math.min(100, Math.max(-25, Math.round((correctAnswers - incorrectAnswers * 0.25) * 100) / 100))
      : totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const accuracy = (correctAnswers + incorrectAnswers) > 0
      ? Math.round((correctAnswers / (correctAnswers + incorrectAnswers)) * 1000) / 10
      : 0;

    const savedAttempt = db.saveTestAttempt({
      id: attemptId,
      studentId,
      testId: testId || undefined,
      title: title || 'Quiz Session',
      subjectId: subjectId || 'subj-dbms',
      score,
      totalQuestions,
      correctAnswers,
      incorrectAnswers,
      unattempted,
      accuracy,
      positiveMarks,
      negativeMarks,
      maxScore: isPaperMock ? 100 : undefined,
      timeTaken: Number(timeTaken) || 120,
      questionAttempts
    });
    await db.flush();

    // Automatically trigger AI performance analyzer and recommendation update!
    const updatedAnalytics = await AIService.analyzeStudent(studentId);

    res.status(200).json({
      attempt: savedAttempt,
      topicBreakdown,
      updatedAnalytics,
      message: 'Quiz submitted and evaluated successfully. AI recommendations processed.'
    });
  } catch (err: any) {
    console.error('Error submitting quiz:', err);
    res.status(500).json({ message: err.message || 'Error evaluating quiz submission.' });
  }
};

export const getStudentHistory = (req: AuthenticatedRequest, res: Response) => {
  const studentId = req.params.studentId || req.user?.id;
  if (!studentId) {
    res.status(400).json({ message: 'studentId is required.' });
    return;
  }
  const history = db.getStudentAttempts(studentId);
  res.json(history);
};
