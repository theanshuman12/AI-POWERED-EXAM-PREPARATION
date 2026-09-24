import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  PerformanceAnalysisResponse,
  TestAttempt,
  Subject
} from '../types';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BookOpen,
  HelpCircle,
  FileCheck2,
  ChevronRight,
  Flame
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface StudentDashboardProps {
  onNavigate: (view: string, payload?: any) => void;
  onStartQuiz: (params: { subjectId?: string; topicId?: string; testId?: string; difficulty?: string }) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onStartQuiz
}) => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<PerformanceAnalysisResponse | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<TestAttempt[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [adminRequest, setAdminRequest] = useState<any>(null);
  const [passwordResetRequest, setPasswordResetRequest] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [perfRes, subRes] = await Promise.all([
          api.getPerformance(user.id),
          api.getSubjects()
        ]);
        setAnalysis(perfRes);
        setRecentAttempts(perfRes.attempts ? perfRes.attempts.slice(0, 5) : []);
        setSubjects(subRes.slice(0, 4));
        const requestRes = await api.getMyAdminRequest();
        setAdminRequest(requestRes.request);
        const resetRequestRes = await api.getMyPasswordResetRequest();
        setPasswordResetRequest(resetRequestRes.request);
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Preparing your academic dashboard..." />
      </div>
    );
  }

  const avgScore = recentAttempts.length > 0
    ? Math.round(recentAttempts.reduce((sum, a) => sum + a.score, 0) / recentAttempts.length)
    : 0;

  const overallAccuracyPercent = analysis ? Math.round(analysis.overallAccuracy * 100) : 0;
  const topRecommendations = analysis?.recommendations.slice(0, 3) || [];

  return (
    <div id="student-dashboard" className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Active Study Session</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl leading-relaxed">
            Your personalized performance analytics and adaptive study recommendations are updated in real-time based on your test results.
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            id="dash-quick-mock-btn"
            onClick={() => onNavigate('tests')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-2 shadow-xs transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Take a Mock Test</span>
          </button>
        </div>
      </div>

      {adminRequest && (
        <div className={`rounded-2xl p-4 border text-xs ${adminRequest.status === 'REJECTED' ? 'bg-rose-50 border-rose-200 text-rose-800' : adminRequest.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
          <strong>Admin access: {adminRequest.status === 'PENDING' ? 'Admin approval pending.' : adminRequest.status}</strong>
          {adminRequest.reason && <span> {adminRequest.reason}</span>}
        </div>
      )}

      {passwordResetRequest && (
        <div className="rounded-2xl p-4 border text-xs bg-slate-50 border-slate-200 text-slate-700">
          <strong>Password reset: {passwordResetRequest.status}</strong>
          {passwordResetRequest.reason && <span> {passwordResetRequest.reason}</span>}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Tests</span>
            <FileCheck2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-display">
            {analysis?.totalTests || 0}
          </p>
          <span className="text-[11px] text-slate-500">Completed assessments</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Average Score</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-display font-mono">
            {avgScore}%
          </p>
          <span className="text-[11px] text-slate-500">Across recent tests</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Overall Accuracy</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-display font-mono">
            {overallAccuracyPercent}%
          </p>
          <span className="text-[11px] text-slate-500">{analysis?.totalQuestionsAttempted || 0} questions attempted</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Weak Topics</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 font-display">
            {analysis?.weakTopics.length || 0}
          </p>
          <span className="text-[11px] text-rose-600 font-medium">Requiring immediate revision</span>
        </div>
      </div>

      {/* Top AI Recommendations Highlight */}
      <div className="bg-gradient-to-br from-indigo-50/60 via-blue-50/40 to-white rounded-3xl p-6 border border-indigo-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Priority Adaptive Recommendations
              </h3>
              <p className="text-xs text-slate-500">
                Calculated dynamically from your actual test question responses
              </p>
            </div>
          </div>
          <button
            id="view-all-recs-btn"
            onClick={() => onNavigate('recommendations')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
          >
            <span>View All ({analysis?.recommendations.length || 0})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {topRecommendations.length === 0 ? (
          <div className="p-6 bg-white/80 rounded-2xl border border-indigo-100/80 text-center space-y-2">
            <p className="text-xs text-slate-600 font-medium">
              No recommendations generated yet. Attempt a quiz or seed demo performance data.
            </p>
            <button
              onClick={() => onNavigate('recommendations')}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Go to AI Recommendations Page &rarr;
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topRecommendations.map(rec => {
              const isWeak = rec.performanceLevel === 'Weak';
              const isModerate = rec.performanceLevel === 'Moderate';
              const badgeClass = isWeak
                ? 'bg-rose-100 text-rose-800 border-rose-200'
                : isModerate
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border-emerald-200';

              return (
                <div
                  key={rec.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${badgeClass}`}>
                        {rec.performanceLevel}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Score: {(rec.performanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{rec.topic}</h4>
                    <p className="text-xs text-slate-600 leading-snug line-clamp-2">
                      {rec.action}
                    </p>
                  </div>

                  <button
                    onClick={() => onStartQuiz({ topicId: rec.topicId, difficulty: rec.recommendedDifficulty })}
                    className="w-full mt-2 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <span>Practice {rec.recommendedDifficulty}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Subjects Quick Access */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Core Subjects Curriculum</span>
            </h3>
            <button
              onClick={() => onNavigate('subjects')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjects.map(subj => (
              <div
                key={subj.id}
                onClick={() => onNavigate('subjects', { selectedSubjectId: subj.id })}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {subj.name}
                  </h4>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {subj.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Test Attempts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Recent Test Attempts</span>
          </h3>

          {recentAttempts.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              No recent attempts logged yet.
            </p>
          ) : (
            <div className="space-y-2.5">
              {recentAttempts.map(att => (
                <div key={att.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900 line-clamp-1">{att.title}</p>
                    <span className="text-[10px] text-slate-400">
                      {new Date(att.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
                    att.subjectId === 'subj-uppet-paper-mock'
                      ? att.score >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      : att.score >= 70 ? 'bg-emerald-100 text-emerald-800' : att.score >= 40 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {att.subjectId === 'subj-uppet-paper-mock'
                      ? `${Number(att.score).toFixed(2).replace(/\.00$/, '')}/100`
                      : `${att.score}%`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => onNavigate('history')}
            className="w-full text-center py-2 text-xs font-semibold text-blue-600 hover:underline block"
          >
            View Full Attempt History &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
