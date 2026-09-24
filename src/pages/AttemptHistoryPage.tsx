import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { TestAttempt } from '../types';
import {
  History,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface AttemptHistoryPageProps {
  onStartQuiz: (params: { subjectId?: string; topicId?: string; testId?: string; difficulty?: string }) => void;
}

export const AttemptHistoryPage: React.FC<AttemptHistoryPageProps> = ({ onStartQuiz }) => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const data = await api.getAttemptHistory(user.id);
        setAttempts(data);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Retrieving assessment records and historical scores..." />
      </div>
    );
  }

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem}s`;
  };

  return (
    <div id="history-page-container" className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Test Attempt History &amp; Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
          Chronological record of all quizzes, practice drills, and mock tests you have completed on the platform.
        </p>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 max-w-md mx-auto shadow-xs">
          <History className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Historical Attempts Found</h3>
          <p className="text-xs text-slate-500">
            You haven't completed any tests or quizzes yet. Launch your first practice session now!
          </p>
          <button
            onClick={() => onStartQuiz({})}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
          >
            Start a Practice Quiz
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {attempts.map((att, idx) => {
              const isPaperMock = att.subjectId === 'subj-uppet-paper-mock';
              const displayedMarks = Number(att.score).toFixed(2).replace(/\.00$/, '');
              return (
                <div key={att.id} className="p-5 sm:p-6 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-500">Attempt #{attempts.length - idx}</span>
                      <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(att.createdAt).toLocaleDateString()} at {new Date(att.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{att.title}</h3>
                    <div className="flex items-center space-x-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatTime(att.timeTaken)}</span>
                      </span>
                      <span className="flex items-center space-x-1 text-emerald-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{att.correctAnswers} correct</span>
                      </span>
                      <span className="flex items-center space-x-1 text-rose-600">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{att.incorrectAnswers} incorrect</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 self-end sm:self-center">
                    <div className={`px-4 py-2 rounded-2xl border text-center font-mono ${
                      isPaperMock
                        ? att.score >= 0
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                        : att.score >= 70
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : att.score >= 40
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      <span className="text-xl font-extrabold">{isPaperMock ? `${displayedMarks}/100` : `${att.score}%`}</span>
                      <span className="block text-[9px] uppercase font-bold tracking-wider">{isPaperMock ? 'Marks' : 'Score'}</span>
                    </div>

                    <button
                      onClick={() => onStartQuiz({ testId: att.testId, subjectId: att.subjectId })}
                      className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Retake Quiz"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
