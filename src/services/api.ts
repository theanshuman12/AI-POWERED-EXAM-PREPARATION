import {
  User,
  Exam,
  Subject,
  Topic,
  Question,
  Test,
  TestAttempt,
  PerformanceAnalysisResponse,
  Recommendation,
  AuthResponse,
  AdminRequest,
  RegistrationResponse
} from '../types';

const API_BASE = '/api';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('ai_prep_token');
  }

  public setToken(token: string) {
    localStorage.setItem('ai_prep_token', token);
  }

  public removeToken() {
    localStorage.removeItem('ai_prep_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMsg = 'An error occurred during API request';
      try {
        const errJson = await response.json();
        errorMsg = errJson.message || errorMsg;
      } catch (_) {
        errorMsg = `HTTP Error ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMsg);
    }

    return response.json();
  }

  // --- Auth APIs ---
  login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  register(data: { name: string; email: string; password: string; requestAdminAccess?: boolean }): Promise<RegistrationResponse> {
    return this.request<RegistrationResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  submitAdminRequest(): Promise<{ request: AdminRequest; message: string }> {
    return this.request('/admin-requests', { method: 'POST', body: JSON.stringify({}) });
  }

  getMyAdminRequest(): Promise<{ request: AdminRequest | null }> {
    return this.request('/admin-requests/me');
  }

  getAdminRequests(): Promise<{ requests: AdminRequest[] }> {
    return this.request('/admin-requests');
  }

  reviewAdminRequest(id: string, action: 'approve' | 'reject', reason?: string): Promise<{ request: AdminRequest; message: string }> {
    return this.request(`/admin-requests/${id}/${action}`, {
      method: 'PUT',
      body: JSON.stringify({ reason })
    });
  }

  requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.request('/auth/password-reset-requests', { method: 'POST', body: JSON.stringify({ email }) });
  }

  completePasswordReset(token: string, password: string): Promise<{ message: string }> {
    return this.request('/auth/password-reset', { method: 'POST', body: JSON.stringify({ token, password }) });
  }

  getMyPasswordResetRequest(): Promise<{ request: AdminRequest | null }> {
    return this.request('/auth/password-reset-requests/me');
  }

  getStudentRegistrationRequests(): Promise<{ requests: AdminRequest[] }> {
    return this.request('/super-admin/registration-requests');
  }

  reviewStudentRegistration(id: string, action: 'approve' | 'reject', reason?: string): Promise<{ request: AdminRequest; message: string }> {
    return this.request(`/super-admin/registration-requests/${id}/${action}`, { method: 'POST', body: JSON.stringify({ reason }) });
  }

  getPasswordResetRequests(): Promise<{ requests: AdminRequest[] }> {
    return this.request('/super-admin/password-reset-requests');
  }

  reviewPasswordReset(id: string, action: 'approve' | 'reject', reason?: string): Promise<{ request: AdminRequest; resetToken?: string; message: string }> {
    return this.request(`/super-admin/password-reset-requests/${id}/${action}`, { method: 'POST', body: JSON.stringify({ reason }) });
  }

  suspendUser(id: string): Promise<{ message: string; user: User }> {
    return this.request(`/super-admin/users/${id}/suspend`, { method: 'POST' });
  }

  unsuspendUser(id: string): Promise<{ message: string; user: User }> {
    return this.request(`/super-admin/users/${id}/unsuspend`, { method: 'POST' });
  }

  getAuditLogs(): Promise<{ logs: any[] }> {
    return this.request('/super-admin/audit-logs');
  }

  getSuperAdminDashboard(): Promise<any> {
    return this.request('/super-admin/dashboard');
  }

  getSuperAdminStudents(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<{ students: User[]; total: number; page: number; limit: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return this.request(`/super-admin/students?${query.toString()}`);
  }

  getSuperAdminStudent(id: string): Promise<any> {
    return this.request(`/super-admin/students/${id}`);
  }

  getSuperAdminAttempt(studentId: string, attemptId: string): Promise<any> {
    return this.request(`/super-admin/students/${studentId}/attempts/${attemptId}`);
  }

  getSuperAdminMockTests(): Promise<{ tests: any[] }> {
    return this.request('/super-admin/mock-tests');
  }

  updateMockTestStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<{ test: Test }> {
    return this.request(`/super-admin/mock-tests/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  }

  getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/auth/profile');
  }

  getAllStudents(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/auth/students');
  }

  // --- Subjects ---
  getExams(): Promise<Exam[]> {
    return this.request<Exam[]>('/exams');
  }

  getSubjects(): Promise<Subject[]> {
    return this.request<Subject[]>('/subjects');
  }

  getSubject(id: string): Promise<Subject> {
    return this.request<Subject>(`/subjects/${id}`);
  }

  createSubject(data: { examId: string; name: string; description: string; icon?: string }): Promise<Subject> {
    return this.request<Subject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
    return this.request<Subject>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteSubject(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/subjects/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Topics ---
  getTopics(subjectId?: string): Promise<Topic[]> {
    const query = subjectId ? `?subjectId=${subjectId}` : '';
    return this.request<Topic[]>(`/topics${query}`);
  }

  getTopic(id: string): Promise<Topic> {
    return this.request<Topic>(`/topics/${id}`);
  }

  createTopic(data: { subjectId: string; name: string; description: string }): Promise<Topic> {
    return this.request<Topic>('/topics', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateTopic(id: string, data: Partial<Topic>): Promise<Topic> {
    return this.request<Topic>(`/topics/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteTopic(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/topics/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Questions ---
  getQuestions(params?: { subjectId?: string; topicId?: string; difficulty?: string }): Promise<Question[]> {
    const searchParams = new URLSearchParams();
    if (params?.subjectId) searchParams.append('subjectId', params.subjectId);
    if (params?.topicId) searchParams.append('topicId', params.topicId);
    if (params?.difficulty) searchParams.append('difficulty', params.difficulty);
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return this.request<Question[]>(`/questions${query}`);
  }

  createQuestion(data: Omit<Question, 'id' | 'createdAt'>): Promise<Question> {
    return this.request<Question>('/questions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  updateQuestion(id: string, data: Partial<Question>): Promise<Question> {
    return this.request<Question>(`/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  deleteQuestion(id: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/questions/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Tests & Quizzes ---
  getTests(): Promise<Test[]> {
    return this.request<Test[]>('/tests');
  }

  getTest(id: string): Promise<Test & { questionDetails: Question[] }> {
    return this.request<Test & { questionDetails: Question[] }>(`/tests/${id}`);
  }

  startMockAttempt(testId: string): Promise<{
    attemptId: string;
    title: string;
    subjectId: string;
    duration: number;
    questionDetails: Question[];
  }> {
    return this.request(`/tests/${testId}/start`, { method: 'POST' });
  }

  createTest(data: Omit<Test, 'id' | 'createdAt'>): Promise<Test> {
    return this.request<Test>('/tests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  startPractice(params: { subjectId?: string; topicId?: string; difficulty?: string; count?: number }): Promise<{
    sessionTitle: string;
    subjectId?: string;
    topicId?: string;
    questions: Question[];
    duration: number;
  }> {
    return this.request('/tests/start', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  submitTest(submission: {
    testId?: string;
    attemptId?: string;
    title: string;
    subjectId: string;
    timeTaken: number;
    answers: { questionId: string; selectedAnswer: number; responseTime: number }[];
  }): Promise<{
    attempt: TestAttempt;
    topicBreakdown: Record<string, { total: number; correct: number; name: string }>;
    updatedAnalytics: PerformanceAnalysisResponse;
    message: string;
  }> {
    return this.request('/tests/submit', {
      method: 'POST',
      body: JSON.stringify(submission)
    });
  }

  getAttemptHistory(studentId?: string): Promise<TestAttempt[]> {
    const path = studentId ? `/tests/history?studentId=${studentId}` : '/tests/history';
    return this.request<TestAttempt[]>(path);
  }

  // --- Performance & Recommendations ---
  getPerformance(studentId: string): Promise<PerformanceAnalysisResponse & { attempts: TestAttempt[] }> {
    return this.request<PerformanceAnalysisResponse & { attempts: TestAttempt[] }>(`/performance/${studentId}`);
  }

  getRecommendations(studentId: string): Promise<{ studentId: string; recommendations: Recommendation[] }> {
    return this.request<{ studentId: string; recommendations: Recommendation[] }>(`/recommendations/${studentId}`);
  }

  triggerRecommendationAnalysis(studentId: string): Promise<{ message: string; analysis: PerformanceAnalysisResponse }> {
    return this.request('/recommendations/analyze', {
      method: 'POST',
      body: JSON.stringify({ studentId })
    });
  }

  seedDemoPerformance(studentId: string): Promise<{ message: string; analysis: PerformanceAnalysisResponse }> {
    return this.request('/performance/seed-demo', {
      method: 'POST',
      body: JSON.stringify({ studentId })
    });
  }

  // --- AI Explainer & Hints ---
  explainConcept(params: { topicName: string; subjectName?: string; subjectId?: string; topicId?: string; difficulty?: string; questionContext?: string }): Promise<{
    topicName: string;
    explanation: string;
    source: string;
  }> {
    return this.request('/ai/explain', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  getQuestionHint(params: { question: string; options: string[] }): Promise<{ hint: string }> {
    return this.request('/ai/hint', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
}

export const api = new ApiClient();
