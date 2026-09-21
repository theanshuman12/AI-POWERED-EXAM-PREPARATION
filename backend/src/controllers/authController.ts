import { Request, Response } from 'express';
import { db } from '../services/databaseService';
import { generateToken, AuthenticatedRequest } from '../middleware/authMiddleware';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, requestAdminAccess } = req.body;
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
      status: 'PENDING'
    });
    const request = db.createStudentRegistrationRequest(newUser.id);
    const adminRequest = requestAdminAccess ? db.createAdminRequest(newUser.id) : undefined;
    await db.flush();
    res.status(201).json({
      user: newUser,
      request,
      adminRequest,
      message: 'Your registration request has been submitted and is waiting for approval from the Super Admin.'
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
      res.status(401).json({ message: 'Invalid credentials or account is not active.' });
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

export const getStudentRegistrationRequests = async (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ requests: db.getRequests('STUDENT_REGISTRATION') });
};

export const reviewStudentRegistration = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const approve = req.params.action === 'approve';
    if (!['approve', 'reject'].includes(req.params.action)) {
      res.status(400).json({ message: 'Action must be approve or reject.' });
      return;
    }
    const request = db.reviewStudentRegistration(req.params.id, req.user!.id, approve, req.body?.reason);
    if (!request) {
      res.status(404).json({ message: 'Student registration request not found.' });
      return;
    }
    await db.flush();
    res.status(200).json({ request, message: `Student registration ${approve ? 'approved' : 'rejected'}.` });
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Unable to review registration request.' });
  }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim();
    if (!email) {
      res.status(400).json({ message: 'Email is required.' });
      return;
    }
    db.requestPasswordReset(email);
    await db.flush();
    res.status(202).json({ message: 'Your password reset request has been submitted. Please wait for Super Admin approval.' });
  } catch (err: any) {
    res.status(503).json({ message: err.message || 'Unable to save the password reset request.' });
  }
};

export const getPasswordResetRequests = async (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ requests: db.getRequests('PASSWORD_RESET') });
};

export const getMyPasswordResetRequest = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }
  res.status(200).json({ request: db.getRequestForUser(req.user.id, 'PASSWORD_RESET') || null });
};

export const reviewPasswordReset = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const approve = req.params.action === 'approve';
    if (!['approve', 'reject'].includes(req.params.action)) {
      res.status(400).json({ message: 'Action must be approve or reject.' });
      return;
    }
    const request = db.reviewPasswordReset(req.params.id, req.user!.id, approve, req.body?.reason);
    if (!request) {
      res.status(404).json({ message: 'Password reset request not found.' });
      return;
    }
    await db.flush();
    const response: { request: typeof request; resetToken?: string; message: string } = {
      request: { ...request, reason: approve ? undefined : request.reason },
      message: `Password reset ${approve ? 'approved' : 'rejected'}.`
    };
    if (approve) response.resetToken = request.reason;
    res.status(200).json(response);
  } catch (err: any) {
    res.status(400).json({ message: err.message || 'Unable to review password reset request.' });
  }
};

export const completePasswordReset = async (req: Request, res: Response) => {
  try {
    const token = String(req.body?.token || '');
    const password = String(req.body?.password || '');
    if (!token || password.length < 6) {
      res.status(400).json({ message: 'A reset token and password of at least 6 characters are required.' });
      return;
    }
    if (!db.completePasswordReset(token, password)) {
      res.status(400).json({ message: 'Reset token is invalid or expired.' });
      return;
    }
    await db.flush();
    res.status(200).json({ message: 'Password reset completed successfully.' });
  } catch (err: any) {
    res.status(503).json({ message: err.message || 'Unable to save the new password.' });
  }
};

export const getAuditLogs = async (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({ logs: db.getAuditLogs() });
};

export const updateUserSuspension = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const suspended = req.params.action === 'suspend';
    if (!['suspend', 'unsuspend'].includes(req.params.action)) {
      res.status(400).json({ message: 'Action must be suspend or unsuspend.' });
      return;
    }
    const user = db.setUserStatus(req.params.id, req.user!.id, suspended);
    if (!user) {
      res.status(400).json({ message: 'User cannot be suspended or was not found.' });
      return;
    }
    await db.flush();
    res.status(200).json({ user, message: `User ${suspended ? 'suspended' : 'unsuspended'}.` });
  } catch (err: any) {
    res.status(503).json({ message: err.message || 'Unable to save the account status.' });
  }
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
    await db.flush();
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
  try {
    await db.flush();
  } catch (err: any) {
    res.status(503).json({ message: err.message || 'Unable to save the Admin request review.' });
    return;
  }
  res.status(200).json({ request, message: `Admin request ${approve ? 'approved' : 'rejected'}.` });
};
