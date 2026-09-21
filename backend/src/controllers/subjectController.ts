import { Request, Response } from 'express';
import { db } from '../services/databaseService';

export const getSubjects = (req: Request, res: Response) => {
  const subjects = db.getSubjects();
  res.json(subjects);
};

export const getExams = (req: Request, res: Response) => {
  res.json(db.getExams());
};

export const getSubjectById = (req: Request, res: Response) => {
  const subject = db.getSubjectById(req.params.id);
  if (!subject) {
    res.status(404).json({ message: 'Subject not found.' });
    return;
  }
  res.json(subject);
};

export const createSubject = async (req: Request, res: Response) => {
  try {
    const { examId, name, description, icon } = req.body;
    if (!examId || !name) {
      res.status(400).json({ message: 'examId and subject name are required.' });
      return;
    }
    const newSub = db.createSubject({ examId, name, description: description || '', icon });
    await db.flush();
    res.status(201).json(newSub);
  } catch (err: any) {
    res.status(503).json({ message: err.message || 'Unable to save the subject.' });
  }
};

export const updateSubject = async (req: Request, res: Response) => {
  try {
    const updated = db.updateSubject(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ message: 'Subject not found.' });
      return;
    }
    await db.flush();
    res.json(updated);
  } catch (err: any) {
    res.status(503).json({ message: err.message || 'Unable to save the subject.' });
  }
};

export const deleteSubject = async (req: Request, res: Response) => {
  try {
    const ok = db.deleteSubject(req.params.id);
    if (!ok) {
      res.status(404).json({ message: 'Subject not found or could not be deleted.' });
      return;
    }
    await db.flush();
    res.json({ message: 'Subject and associated topics deleted successfully.' });
  } catch (err: any) {
    res.status(503).json({ message: err.message || 'Unable to save the subject changes.' });
  }
};
