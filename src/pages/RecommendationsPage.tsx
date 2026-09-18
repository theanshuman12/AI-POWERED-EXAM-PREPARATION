import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Recommendation, TopicPerformance, PerformanceAnalysisResponse } from '../types';
import {
  Sparkles,
  AlertOctagon,
  CheckCircle2,
  TrendingUp,
  Clock,
  ArrowRight,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Zap,
  RefreshCw,
  Info,
  Layers,
  ChevronRight
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface RecommendationsPageProps {
  onStartPractice: (subjectId: string, topicId: string, difficulty: string) => void;
  onOpenConceptExplainer: (topicName: string, subjectName: string) => void;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  onStartPractice,
  onOpenConceptExplainer
}) => {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<PerformanceAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [seedingDemo, setSeedingDemo] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'weak' | 'moderate' | 'strong'>('all');
  const [showFormulaModal, setShowFormulaModal] = useState<boolean>(false);

  const fetchRecommendations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getPerformance(user.id);
      setAnalysis(res);
    } catch (err) {
      console.error('Failed to load performance & recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const handleSeedDemoData = async () => {
    if (!user) return;
    setSeedingDemo(true);
    try {
      const res = await api.seedDemoPerformance(user.id);
      setAnalysis(res.analysis);
    } catch (err: any) {
      alert('Error injecting demo performance data: ' + err.message);
    } finally {
      setSeedingDemo(false);
    }
  };

  const filteredRecommendations = analysis?.recommendations.filter(rec => {
    if (activeTab === 'weak') return rec.performanceLevel === 'Weak';
    if (activeTab === 'moderate') return rec.performanceLevel === 'Moderate';
    if (activeTab === 'strong') return rec.performanceLevel === 'Strong';
    return true;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Calculating explainable performance metrics & compiling adaptive recommendations..." />
      </div>
    );
  }

  const hasData = analysis && (analysis.weakTopics.length > 0 || analysis.moderateTopics.length > 0 || analysis.strongTopics.length > 0);

  return (
    <div id="ai-recommendations-dashboard" className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Performance-Based AI Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Personalized AI Study Recommendations
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Dynamically adapted to your actual test accuracy, recent attempt momentum, and response timing.
              Explainable, transparent, and non-neural mathematical classification.
            </p>
          </div>

          {/* Quick Viva Demo Seed Button */}
          <div className="flex flex-col items-stretch sm:items-end space-y-2 w-full sm:w-auto">
            <button
              id="seed-demo-viva-btn"
              onClick={handleSeedDemoData}
              disabled={seedingDemo}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>{seedingDemo ? 'Injecting DBMS Records...' : 'Demonstrate Viva Benchmark Data'}</span>
            </button>
            <span className="text-[11px] text-slate-300 text-center sm:text-right">
              Seeds DBMS: SQL JOIN 88%, Normalization 42%, Transactions 55%
            </span>
          </div>
        </div>

        {/* Explainable Metric Formula Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white">Mathematical Engine Formula:</span>
            <code className="bg-white/10 px-2.5 py-1 rounded-lg font-mono text-[11px] text-indigo-200 border border-white/10">
              Score = 0.50 × OverallAcc + 0.30 × RecentAcc + 0.20 × TimePerf
            </code>
          </div>
          <button
            onClick={() => setShowFormulaModal(true)}
            className="text-xs text-indigo-300 hover:text-white underline cursor-pointer flex items-center space-x-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>How is this calculated? (Viva Explanation)</span>
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Not Enough Performance Data Yet</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Complete quizzes or mock tests to allow the performance analyzer to calculate your topic metrics and generate targeted recommendations.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleSeedDemoData}
              disabled={seedingDemo}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-xs"
            >
              Seed Realistic Demo Records
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Classification Overview Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  <span>Weak Topics (&lt;40%)</span>
                </span>
                <span className="text-xl font-extrabold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {analysis?.weakTopics.length || 0}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Action required: Revise fundamental axioms and begin with Easy questions.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-amber-600" />
                  <span>Moderate Topics (40-70%)</span>
                </span>
                <span className="text-xl font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {analysis?.moderateTopics.length || 0}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Focus on multi-concept scenarios and intermediate question sets.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Strong Topics (&gt;70%)</span>
                </span>
                <span className="text-xl font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {analysis?.strongTopics.length || 0}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                High retention. Challenge with advanced edge cases and timed mock tests.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
            <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl">
              {(['all', 'weak', 'moderate', 'strong'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'all' ? 'All Priority Recommendations' : `${tab} (${
                    tab === 'weak' ? analysis?.weakTopics.length : tab === 'moderate' ? analysis?.moderateTopics.length : analysis?.strongTopics.length
                  })`}
                </button>
              ))}
            </div>

            <button
              onClick={fetchRecommendations}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>

          {/* Recommendation Cards List */}
          <div className="space-y-4">
            {filteredRecommendations.map((rec) => {
              const isWeak = rec.performanceLevel === 'Weak';
              const isModerate = rec.performanceLevel === 'Moderate';

              const badgeStyle = isWeak
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : isModerate
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200';

              return (
                <div
                  key={rec.id}
                  className={`bg-white rounded-2xl p-6 border transition-all shadow-xs space-y-4 hover:shadow-md ${
                    isWeak ? 'border-rose-200/90' : isModerate ? 'border-amber-200/90' : 'border-emerald-200/90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badgeStyle}`}>
                          {rec.performanceLevel} Topic
                        </span>
                        <span className="text-xs font-medium text-slate-500">{rec.subjectName}</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">{rec.topic}</h3>
                    </div>

                    <div className="flex items-center space-x-4 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] font-medium">Performance Score</span>
                        <span className="font-bold text-slate-900 font-mono text-sm">
                          {(rec.performanceScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="border-l border-slate-200 pl-4">
                        <span className="text-slate-400 block text-[10px] font-medium">Recommended Difficulty</span>
                        <span className="font-bold text-blue-700">
                          {rec.recommendedDifficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Action & Reason */}
                  <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-2">
                    <p className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <Lightbulb className="w-4 h-4 text-amber-500" />
                      <span>Recommended Action: {rec.action}</span>
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-700">System Rationale:</span> {rec.reason}
                    </p>
                  </div>

                  {/* Revision Tips */}
                  {rec.revisionTips && rec.revisionTips.length > 0 && (
                    <div className="space-y-1.5 text-xs text-slate-600">
                      <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                        Targeted Revision Checklist:
                      </p>
                      <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {rec.revisionTips.map((tip, tIdx) => (
                          <li key={tIdx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] flex items-start space-x-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => onOpenConceptExplainer(rec.topic, rec.subjectName)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Generate AI Concept Study Summary</span>
                    </button>

                    <button
                      id={`practice-rec-${rec.topicId}`}
                      onClick={() => onStartPractice('', rec.topicId, rec.recommendedDifficulty)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>Practice {rec.recommendedDifficulty} Questions Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Formula Explanation Modal for College Viva */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600" />
                <span>Viva Defense: AI Recommendation Engine Logic</span>
              </h3>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                This system avoids opaque black-box neural networks in accordance with academic guidelines. Instead, it utilizes an explainable, multi-factor performance function:
              </p>

              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 font-mono text-xs">
                Performance Score = 0.50 × OverallAccuracy + 0.30 × RecentAccuracy + 0.20 × TimePerformance
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-900">Why these specific weights?</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>0.50 Overall Accuracy</strong>: Measures long-term cumulative mastery across all historical attempts.</li>
                  <li><strong>0.30 Recent Accuracy</strong>: Weights the last 5 attempts heavily so student improvement or decline is detected immediately.</li>
                  <li><strong>0.20 Time Performance</strong>: Compares response time against the 35-second optimal target to distinguish genuine comprehension from random guessing or hesitation.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <p className="font-bold text-slate-900">Classification Thresholds:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Score &lt; 0.40</strong>: WEAK &rarr; Recommend Easy difficulty &amp; fundamental concept revision.</li>
                  <li><strong>0.40 &le; Score &le; 0.70</strong>: MODERATE &rarr; Recommend Medium difficulty &amp; scenario problems.</li>
                  <li><strong>Score &gt; 0.70</strong>: STRONG &rarr; Recommend Hard difficulty &amp; timed mock challenges.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
