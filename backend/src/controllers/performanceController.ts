import { Response } from 'express';
import { db } from '../services/databaseService';
import { AIService } from '../services/aiService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getStudentPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user?.id;
    if (!studentId) {
      res.status(400).json({ message: 'studentId is required.' });
      return;
    }

    const analysis = await AIService.analyzeStudent(studentId);
    const attempts = db.getStudentAttempts(studentId);

    res.json({
      studentId,
      ...analysis,
      attempts
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error analyzing student performance.' });
  }
};

export const getTopicPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user?.id;
    if (!studentId) {
      res.status(400).json({ message: 'studentId is required.' });
      return;
    }
    const analysis = await AIService.analyzeStudent(studentId);
    const allTopics = [
      ...analysis.weakTopics,
      ...analysis.moderateTopics,
      ...analysis.strongTopics
    ];
    res.json({ topics: allTopics });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error retrieving topic performance.' });
  }
};

export const seedDemoPerformance = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.body.studentId || req.user?.id;
    if (!studentId) {
      res.status(400).json({ message: 'studentId is required.' });
      return;
    }

    const seedResult = db.seedDemoStudentPerformance(studentId);
    const analysis = await AIService.analyzeStudent(studentId);

    res.json({
      message: 'Demo performance records seeded successfully.',
      details: seedResult,
      analysis
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error seeding demo performance.' });
  }
};
