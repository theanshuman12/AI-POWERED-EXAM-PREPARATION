export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export type AdminRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminRequest {
  id: string;
  userId: string;
  name: string;
  email: string;
  requestedRole: 'ADMIN';
  status: AdminRequestStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reason?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: 'ADMIN_REQUEST_SUBMITTED' | 'ADMIN_REQUEST_APPROVED' | 'ADMIN_REQUEST_REJECTED' | 'ROLE_CHANGED';
  targetUserId: string;
  requestId?: string;
  timestamp: string;
  details?: string;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type PerformanceLevel = 'Weak' | 'Moderate' | 'Strong';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  examId: string;
  name: string;
  description: string;
  icon?: string;
  createdAt: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
  description: string;
  createdAt?: string;
}

export interface Question {
  id: string;
  subjectId: string;
  topicId: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0, 1, 2, 3 index
  explanation: string;
  difficulty: Difficulty;
  createdAt?: string;
}

export interface Test {
  id: string;
  title: string;
  subjectId: string;
  topics: string[];
  questions: string[]; // Question IDs
  duration: number; // in minutes
  difficulty: Difficulty;
  createdAt?: string;
}

export interface QuestionAttempt {
  id: string;
  studentId: string;
  questionId: string;
  topicId: string;
  selectedAnswer: number; // -1 if unattempted
  correct: boolean;
  responseTime: number; // seconds
  difficulty: Difficulty;
  createdAt: string;
}

export interface TestAttempt {
  id: string;
  studentId: string;
  testId?: string;
  title: string;
  subjectId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  unattempted: number;
  accuracy: number; // 0 to 100
  timeTaken: number; // seconds
  questionAttempts?: QuestionAttempt[];
  createdAt: string;
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  subjectName: string;
  totalAttempts: number;
  correctAttempts: number;
  overallAccuracy: number; // 0 to 1
  recentAccuracy: number; // 0 to 1 (last 5 attempts)
  avgResponseTime: number; // seconds
  timePerformance: number; // 0 to 1 (normalized metric based on optimal target 30-45s)
  performanceScore: number; // 0.50*overall + 0.30*recent + 0.20*time
  level: PerformanceLevel; // 'Weak' | 'Moderate' | 'Strong'
  accuracy?: number; // convenience alias
}

export interface Recommendation {
  id: string;
  studentId: string;
  topicId: string;
  topic: string;
  subjectName: string;
  performanceScore: number;
  performanceLevel: PerformanceLevel;
  recommendedDifficulty: Difficulty;
  action: string;
  reason: string;
  revisionTips: string[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PerformanceAnalysisResponse {
  studentId: string;
  overallAccuracy: number;
  totalTests: number;
  totalQuestionsAttempted: number;
  averageResponseTime?: number;
  weakTopics: TopicPerformance[];
  moderateTopics: TopicPerformance[];
  strongTopics: TopicPerformance[];
  recommendations: Recommendation[];
}
