import { Request, Response } from 'express';
import { db } from '../services/databaseService';

export const getTopics = (req: Request, res: Response) => {
  const subjectId = req.query.subjectId as string | undefined;
  const topics = db.getTopics(subjectId);
  res.json(topics);
};

export const getTopicsBySubject = (req: Request, res: Response) => {
  const topics = db.getTopics(req.params.subjectId);
  res.json(topics);
};

export const getTopicById = (req: Request, res: Response) => {
  const topic = db.getTopicById(req.params.id);
  if (!topic) {
    res.status(404).json({ message: 'Topic not found.' });
    return;
  }
  res.json(topic);
};

export const createTopic = (req: Request, res: Response) => {
  const { subjectId, name, description } = req.body;
  if (!subjectId || !name) {
    res.status(400).json({ message: 'subjectId and name are required.' });
    return;
  }
  const newTopic = db.createTopic({ subjectId, name, description: description || '' });
  res.status(201).json(newTopic);
};

export const updateTopic = (req: Request, res: Response) => {
  const updated = db.updateTopic(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ message: 'Topic not found.' });
    return;
  }
  res.json(updated);
};

export const deleteTopic = (req: Request, res: Response) => {
  const ok = db.deleteTopic(req.params.id);
  if (!ok) {
    res.status(404).json({ message: 'Topic not found or could not be deleted.' });
    return;
  }
  res.json({ message: 'Topic and associated questions deleted successfully.' });
};
