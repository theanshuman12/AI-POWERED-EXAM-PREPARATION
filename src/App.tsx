import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { StudentDashboard } from './pages/StudentDashboard';
import { SubjectsPage } from './pages/SubjectsPage';
import { TestsPage } from './pages/TestsPage';
import { QuizPage } from './pages/QuizPage';
import { ResultsPage } from './pages/ResultsPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AttemptHistoryPage } from './pages/AttemptHistoryPage';
import { ConceptExplainerPage } from './pages/ConceptExplainerPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPages } from './pages/AuthPages';

function MainApp() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Active quiz state
  const [quizParams, setQuizParams] = useState<{
    testId?: string;
    subjectId?: string;
    topicId?: string;
    difficulty?: string;
  } | null>(null);

  // Evaluated quiz results
  const [quizResultData, setQuizResultData] = useState<any>(null);

  // Concept explainer context
  const [explainerTopic, setExplainerTopic] = useState<string>('Normalization');
  const [explainerSubject, setExplainerSubject] = useState<string>('Database Management Systems (DBMS)');

  // Selected subject for curriculum navigation
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('subj-dbms');

  // Handle launching a quiz or practice session
  const handleStartQuiz = (params: {
    testId?: string;
    subjectId?: string;
    topicId?: string;
    difficulty?: string;
  }) => {
    setQuizParams(params);
    setActiveView('quiz');
  };

  // Handle quiz submission finish
  const handleFinishQuiz = (resultData: any) => {
    setQuizResultData(resultData);
    setActiveView('results');
  };

  // Open Concept Explainer with preset topic
  const handleOpenConceptExplainer = (topicName: string, subjectName: string) => {
    setExplainerTopic(topicName);
    setExplainerSubject(subjectName);
    setActiveView('concept-explainer');
  };

  // Switch views with custom payload
  const handleNavigate = (view: string, payload?: any) => {
    if (view === 'subjects' && payload?.selectedSubjectId) {
      setSelectedSubjectId(payload.selectedSubjectId);
    }
    setActiveView(view);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Initializing Exam Preparation Portal...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated and is on login/register view
  if (!isAuthenticated && (activeView === 'login' || activeView === 'register')) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar
          activeView={activeView}
          setActiveView={setActiveView}
          onToggleSidebar={() => {}}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <AuthPages
            initialMode={activeView === 'register' ? 'register' : 'login'}
            onSuccess={() => setActiveView('dashboard')}
          />
        </main>
      </div>
    );
  }

  // Default to student dashboard or login prompt
  const currentView = !isAuthenticated ? 'login' : activeView;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
      />

      <div className="flex-1 flex">
        {/* Persistent App Sidebar */}
        {isAuthenticated && (
          <Sidebar
            activeView={activeView}
            setActiveView={setActiveView}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main
          className={`flex-1 transition-all duration-200 ease-in-out pb-16 ${
            isAuthenticated ? 'lg:pl-64' : ''
          }`}
        >
          {/* Active View Router */}
          {!isAuthenticated && (
            <AuthPages
              initialMode="login"
              onSuccess={() => setActiveView('dashboard')}
            />
          )}

          {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && activeView === 'admin-dashboard' && (
            <AdminDashboard />
          )}

          {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && activeView.startsWith('admin-') && (
            <AdminDashboard initialTab={activeView === 'admin-requests' ? 'requests' : activeView === 'admin-student-requests' ? 'student-requests' : activeView === 'admin-password-resets' ? 'password-resets' : activeView === 'admin-users' ? 'users' : activeView === 'admin-audit' ? 'audit' : 'overview'} />
          )}

          {isAuthenticated && (user?.role === 'USER' || activeView === 'dashboard') && activeView === 'dashboard' && (
            <StudentDashboard
              onNavigate={handleNavigate}
              onStartQuiz={handleStartQuiz}
            />
          )}

          {isAuthenticated && activeView === 'subjects' && (
            <SubjectsPage
              initialSubjectId={selectedSubjectId}
              onStartPractice={handleStartQuiz}
              onOpenConceptExplainer={handleOpenConceptExplainer}
            />
          )}

          {isAuthenticated && activeView === 'tests' && (
            <TestsPage onStartQuiz={handleStartQuiz} />
          )}

          {isAuthenticated && activeView === 'quiz' && (
            <QuizPage
              testId={quizParams?.testId}
              subjectId={quizParams?.subjectId}
              topicId={quizParams?.topicId}
              difficulty={quizParams?.difficulty}
              onFinishQuiz={handleFinishQuiz}
              onExitQuiz={() => setActiveView('dashboard')}
            />
          )}

          {isAuthenticated && activeView === 'results' && quizResultData && (
            <ResultsPage
              resultData={quizResultData}
              onRetake={() => handleStartQuiz(quizParams || {})}
              onGoToRecommendations={() => setActiveView('recommendations')}
              onGoToDashboard={() => setActiveView('dashboard')}
            />
          )}

          {isAuthenticated && activeView === 'recommendations' && (
            <RecommendationsPage
              onStartPractice={(subjId, topId, diff) => handleStartQuiz({ subjectId: subjId, topicId: topId, difficulty: diff })}
              onOpenConceptExplainer={handleOpenConceptExplainer}
            />
          )}

          {isAuthenticated && activeView === 'analytics' && (
            <AnalyticsPage />
          )}

          {isAuthenticated && activeView === 'history' && (
            <AttemptHistoryPage onStartQuiz={handleStartQuiz} />
          )}

          {isAuthenticated && activeView === 'concept-explainer' && (
            <ConceptExplainerPage
              initialTopicName={explainerTopic}
              initialSubjectName={explainerSubject}
              onPracticeTopic={(tName) => handleStartQuiz({ topicId: tName })}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
