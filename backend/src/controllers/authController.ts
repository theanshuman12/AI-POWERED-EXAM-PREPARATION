import { Request, Response } from 'express';
import { db } from '../services/databaseService';
import { generateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required fields.' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long.' });
      return;
    }

    const existingUser = db.findUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ message: 'An account with this email address already exists.' });
      return;
    }

    const newUser = db.createUser({
      name,
      email,
      password,
      role: 'USER'
    });

    const token = generateToken(newUser);
    res.status(201).json({
      token,
      user: newUser,
      message: 'Account registered successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Internal server error during registration.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = db.verifyCredentials(email, password);
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password credentials.' });
      return;
    }

    const token = generateToken(user);
    res.status(200).json({
      token,
      user,
      message: 'Login successful.'
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message || 'Internal server error during login.' });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }
  res.status(200).json({ user: req.user });
};

export const getAllStudents = async (req: AuthenticatedRequest, res: Response) => {
  const users = db.getAllUsers();
  res.status(200).json({ users });
};

export const submitAdminRequest = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }
  if (req.user.role !== 'USER') {
    res.status(403).json({ message: 'Only normal users can request Admin access.' });
    return;
  }
  try {
    const request = db.createAdminRequest(req.user.id);
    res.status(201).json({ request, message: 'Admin request submitted successfully.' });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Unable to submit Admin request.' });
  }
};

export const getMyAdminRequest = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }
  res.status(200).json({ request: db.getAdminRequestForUser(req.user.id) || null });
};

export const getAdminRequests = async (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ requests: db.getAdminRequests() });
};

export const reviewAdminRequest = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }
  const approve = req.params.action === 'approve';
  if (req.params.action !== 'approve' && req.params.action !== 'reject') {
    res.status(400).json({ message: 'Action must be approve or reject.' });
    return;
  }
  const request = db.reviewAdminRequest(req.params.id, req.user.id, approve, req.body?.reason);
  if (!request) {
    res.status(404).json({ message: 'Pending Admin request not found.' });
    return;
  }
  res.status(200).json({ request, message: `Admin request ${approve ? 'approved' : 'rejected'}.` });
};
