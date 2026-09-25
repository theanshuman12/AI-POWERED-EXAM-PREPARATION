import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { PerformanceAnalysisResponse, TestAttempt } from '../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PerformanceAnalysisResponse | null>(null);
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const perf = await api.getPerformance(user.id);
        setData(perf);
        setAttempts(perf.attempts || []);
      } catch (err) {
        console.error('Failed to load performance analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Calculating performance charts and score trajectories..." />
      </div>
    );
  }

  // Topic-wise accuracy data for Recharts
  const allTopics = [
    ...(data?.weakTopics || []),
    ...(data?.moderateTopics || []),
    ...(data?.strongTopics || [])
  ];

  const topicChartData = allTopics.map(t => {
    const topicName = t.topicName || (t as any).topic || 'Unknown Topic';
    const acc = t.overallAccuracy !== undefined ? t.overallAccuracy : (t.accuracy || 0);
    return {
      name: topicName.length > 14 ? topicName.substring(0, 12) + '...' : topicName,
      fullName: topicName,
      accuracy: Math.round(acc * 100),
      level: t.level
    };
  });

  // Attempt score progression over time
  const scoreTrendData = [...attempts]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((att, idx) => ({
      name: `Test #${idx + 1}`,
      score: att.subjectId === 'subj-uppet-paper-mock' ? att.accuracy : att.score,
      accuracy: Math.round(att.accuracy),
      date: new Date(att.createdAt).toLocaleDateString()
    }));

  const correctAnswersTotal = attempts.reduce((acc, a) => acc + a.correctAnswers, 0);
  const incorrectAnswersTotal = attempts.reduce((acc, a) => acc + a.incorrectAnswers, 0);
  const unattemptedTotal = attempts.reduce((acc, a) => acc + a.unattempted, 0);

  const pieData = [
    { name: 'Correct', value: correctAnswersTotal, color: '#10b981' },
    { name: 'Incorrect', value: incorrectAnswersTotal, color: '#ef4444' },
    { name: 'Unattempted', value: unattemptedTotal, color: '#94a3b8' }
  ].filter(d => d.value > 0);

  return (
    <div id="analytics-page-container" className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Comprehensive Performance Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
          In-depth empirical insights into your exam preparation, accuracy breakdown across topics, score trajectories over time, and time efficiency.
        </p>
      </div>

      {/* Top Stat Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Overall Accuracy</p>
          <p className="text-2xl font-black text-blue-600 font-display font-mono">
            {data ? Math.round(data.overallAccuracy * 100) : 0}%
          </p>
          <span className="text-[11px] text-slate-400">Total attempted questions</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Average Score</p>
          <p className="text-2xl font-black text-emerald-600 font-display font-mono">
            {attempts.length > 0
              ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
              : 0}%
          </p>
          <span className="text-[11px] text-slate-400">Across {attempts.length} evaluations</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Questions Answered</p>
          <p className="text-2xl font-black text-slate-900 font-display">
            {data?.totalQuestionsAttempted || 0}
          </p>
          <span className="text-[11px] text-slate-400">{correctAnswersTotal} correct</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-semibold text-slate-500">Average Response Time</p>
          <p className="text-2xl font-black text-indigo-600 font-display font-mono">
            {data ? Math.round(data.averageResponseTime) : 0}s
          </p>
          <span className="text-[11px] text-slate-400">Target benchmark: 35s</span>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic-Wise Accuracy Bar Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>Topic-Wise Accuracy (%)</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Heuristic breakdown</span>
          </div>

          {topicChartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No topic attempts logged yet. Complete a quiz to populate charts.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-25} textAnchor="end" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Accuracy']}
                    labelFormatter={(name, items) => items[0]?.payload?.fullName || name}
                  />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                    {topicChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.accuracy >= 70 ? '#10b981' : entry.accuracy >= 40 ? '#f59e0b' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Score Progression Trend Over Time */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <span>Score Progression Trend</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Test score trajectory</span>
          </div>

          {scoreTrendData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-slate-400">
              No tests completed yet.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    formatter={(value: any) => [`${value}%`, 'Score']}
                    labelFormatter={(name, items) => `${name} (${items[0]?.payload?.date || ''})`}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ fill: '#4f46e5', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Answer Distribution & Topic Classifications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Answer Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Answer Accuracy Breakdown
          </h3>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs">
              <span className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Correct Answers</span>
              </span>
              <span className="font-bold text-sm font-mono">{correctAnswersTotal}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 text-xs">
              <span className="flex items-center space-x-2 font-semibold">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Incorrect Answers</span>
              </span>
              <span className="font-bold text-sm font-mono">{incorrectAnswersTotal}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs">
              <span className="flex items-center space-x-2 font-semibold">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Unattempted Questions</span>
              </span>
              <span className="font-bold text-sm font-mono">{unattemptedTotal}</span>
            </div>
          </div>
        </div>

        {/* Weak vs Strong Summary List */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Topic Strength Matrix
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Weak */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-800">Weak Topics</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">
                  {data?.weakTopics.length || 0}
                </span>
              </div>
              <ul className="space-y-1 text-xs text-rose-700">
                {data?.weakTopics.map(t => (
                  <li key={t.topicId} className="flex items-center justify-between">
                    <span className="truncate">{t.topicName}</span>
                    <span className="font-mono font-semibold ml-1">{Math.round((t.overallAccuracy !== undefined ? t.overallAccuracy : (t.accuracy || 0)) * 100)}%</span>
                  </li>
                ))}
                {(!data?.weakTopics || data.weakTopics.length === 0) && (
                  <li className="text-[11px] text-slate-400 italic">None</li>
                )}
              </ul>
            </div>

            {/* Moderate */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-800">Moderate Topics</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                  {data?.moderateTopics.length || 0}
                </span>
              </div>
              <ul className="space-y-1 text-xs text-amber-700">
                {data?.moderateTopics.map(t => (
                  <li key={t.topicId} className="flex items-center justify-between">
                    <span className="truncate">{t.topicName}</span>
                    <span className="font-mono font-semibold ml-1">{Math.round((t.overallAccuracy !== undefined ? t.overallAccuracy : (t.accuracy || 0)) * 100)}%</span>
                  </li>
                ))}
                {(!data?.moderateTopics || data.moderateTopics.length === 0) && (
                  <li className="text-[11px] text-slate-400 italic">None</li>
                )}
              </ul>
            </div>

            {/* Strong */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Strong Topics</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                  {data?.strongTopics.length || 0}
                </span>
              </div>
              <ul className="space-y-1 text-xs text-emerald-700">
                {data?.strongTopics.map(t => (
                  <li key={t.topicId} className="flex items-center justify-between">
                    <span className="truncate">{t.topicName}</span>
                    <span className="font-mono font-semibold ml-1">{Math.round((t.overallAccuracy !== undefined ? t.overallAccuracy : (t.accuracy || 0)) * 100)}%</span>
                  </li>
                ))}
                {(!data?.strongTopics || data.strongTopics.length === 0) && (
                  <li className="text-[11px] text-slate-400 italic">None</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
