import { Response } from 'express';
import { db } from '../services/databaseService';
import { AIService } from '../services/aiService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const getStudentRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.params.studentId || req.user?.id;
    if (!studentId) {
      res.status(400).json({ message: 'studentId is required.' });
      return;
    }

    let recs = db.getStudentRecommendations(studentId);
    if (recs.length === 0) {
      // Trigger an analysis if no recommendations are persisted yet
      const analysis = await AIService.analyzeStudent(studentId);
      recs = analysis.recommendations;
    }

    res.json({
      studentId,
      recommendations: recs
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error fetching recommendations.' });
  }
};

export const triggerAnalysis = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.body.studentId || req.user?.id;
    if (!studentId) {
      res.status(400).json({ message: 'studentId is required.' });
      return;
    }

    const analysis = await AIService.analyzeStudent(studentId);
    res.json({
      message: 'Analysis completed and recommendations updated.',
      analysis
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Error analyzing student recommendations.' });
  }
};
