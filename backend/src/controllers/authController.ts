import { Request, Response } from 'express';
import { db } from '../services/databaseService';
import { generateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
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
      role: role === 'admin' ? 'admin' : 'student'
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
