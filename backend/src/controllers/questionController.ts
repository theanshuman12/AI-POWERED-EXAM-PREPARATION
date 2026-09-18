import { Request, Response } from 'express';
import { db } from '../services/databaseService';

export const getQuestions = (req: Request, res: Response) => {
  const { subjectId, topicId, difficulty } = req.query;
  const questions = db.getQuestions({
    subjectId: subjectId as string,
    topicId: topicId as string,
    difficulty: difficulty as string
  });
  res.json(questions);
};

export const getQuestionById = (req: Request, res: Response) => {
  const q = db.getQuestionById(req.params.id);
  if (!q) {
    res.status(404).json({ message: 'Question not found.' });
    return;
  }
  res.json(q);
};

export const createQuestion = (req: Request, res: Response) => {
  const { subjectId, topicId, question, options, correctAnswer, explanation, difficulty } = req.body;
  if (!subjectId || !topicId || !question || !options || options.length < 2 || correctAnswer === undefined) {
    res.status(400).json({ message: 'Missing required question parameters.' });
    return;
  }

  const newQ = db.createQuestion({
    subjectId,
    topicId,
    question,
    options,
    correctAnswer: Number(correctAnswer),
    explanation: explanation || '',
    difficulty: difficulty || 'Medium'
  });
  res.status(201).json(newQ);
};

export const updateQuestion = (req: Request, res: Response) => {
  const updated = db.updateQuestion(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ message: 'Question not found.' });
    return;
  }
  res.json(updated);
};

export const deleteQuestion = (req: Request, res: Response) => {
  const ok = db.deleteQuestion(req.params.id);
  if (!ok) {
    res.status(404).json({ message: 'Question not found or could not be deleted.' });
    return;
  }
  res.json({ message: 'Question deleted successfully.' });
};
