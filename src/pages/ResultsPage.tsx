import React, { useState } from 'react';
import { TestAttempt, Question } from '../types';
import {
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Award
} from 'lucide-react';

interface ResultsPageProps {
  resultData: {
    attempt: TestAttempt;
    topicBreakdown: Record<string, { total: number; correct: number; name: string }>;
    updatedAnalytics: any;
    questions: Question[];
    answers: Record<number, number>;
    timeTaken: number;
  };
  onRetake: () => void;
  onGoToRecommendations: () => void;
  onGoToDashboard: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  resultData,
  onRetake,
  onGoToRecommendations,
  onGoToDashboard
}) => {
  const { attempt, topicBreakdown, questions, answers, timeTaken, updatedAnalytics } = resultData;
  const [filter, setFilter] = useState<'all' | 'incorrect' | 'correct' | 'unattempted'>('all');

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 45) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const isPaperMock = attempt.subjectId === 'subj-uppet-paper-mock';
  const positiveMarks = attempt.positiveMarks ?? attempt.correctAnswers;
  const negativeMarks = attempt.negativeMarks ?? (attempt.incorrectAnswers * 0.25);
  const formattedScore = Number(attempt.score).toFixed(2).replace(/\.00$/, '');

  const filteredQuestions = questions.filter((_, idx) => {
    const selected = answers[idx];
    const q = questions[idx];
    const isUnattempted = selected === undefined || selected === -1;
    const isCorrect = !isUnattempted && selected === q.correctAnswer;

    if (filter === 'correct') return isCorrect;
    if (filter === 'incorrect') return !isUnattempted && !isCorrect;
    if (filter === 'unattempted') return isUnattempted;
    return true;
  });

  return (
    <div id="results-page-container" className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <Award className="w-3.5 h-3.5" />
              <span>Assessment Completed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Test Performance Summary
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg">
              Detailed breakdown of your accuracy, response times, and topic mastery. Performance metrics have been fed into the AI Recommendation Engine.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className={`flex flex-col items-center justify-center w-28 h-28 sm:w-32 sm:h-32 rounded-3xl border-2 ${getScoreColor(attempt.score)} shadow-xs`}>
              <span className="text-3xl sm:text-4xl font-black font-display tracking-tight">{isPaperMock ? `${formattedScore}/100` : `${attempt.score}%`}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider mt-0.5">Score</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={onRetake}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Practice Again</span>
            </button>
            <button
              onClick={onGoToDashboard}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            >
              Dashboard
            </button>
          </div>

          <button
            id="view-ai-recommendations-btn"
            onClick={onGoToRecommendations}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>View Updated AI Recommendations</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isPaperMock && (
        <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">UPPET Paper Mock Marking Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
            <div><p className="text-slate-500">Total Questions</p><strong>100</strong></div>
            <div><p className="text-slate-500">Correct Answers</p><strong>{attempt.correctAnswers}</strong></div>
            <div><p className="text-slate-500">Wrong Answers</p><strong>{attempt.incorrectAnswers}</strong></div>
            <div><p className="text-slate-500">Unattempted</p><strong>{attempt.unattempted}</strong></div>
            <div><p className="text-slate-500">Final Score</p><strong>{formattedScore}/100</strong></div>
          </div>
          <p className="text-xs text-slate-600">Positive Marks: {positiveMarks} × 1 = {positiveMarks} · Negative Marks: {attempt.incorrectAnswers} × 0.25 = {Number(negativeMarks).toFixed(2)} · Unattempted: 0 deduction</p>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs text-center space-y-1">
          <div className="flex items-center justify-center text-emerald-600 mb-1">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{attempt.correctAnswers}</p>
          <p className="text-xs font-medium text-slate-500">Correct Answers</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs text-center space-y-1">
          <div className="flex items-center justify-center text-rose-600 mb-1">
            <XCircle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{attempt.incorrectAnswers}</p>
          <p className="text-xs font-medium text-slate-500">Incorrect</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs text-center space-y-1">
          <div className="flex items-center justify-center text-slate-400 mb-1">
            <MinusCircle className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{attempt.unattempted}</p>
          <p className="text-xs font-medium text-slate-500">Unattempted</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs text-center space-y-1">
          <div className="flex items-center justify-center text-blue-600 mb-1">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{formatTime(timeTaken)}</p>
          <p className="text-xs font-medium text-slate-500">Time Taken</p>
        </div>
      </div>

      {/* Topic Breakdown Card */}
      {topicBreakdown && Object.keys(topicBreakdown).length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Topic-Wise Assessment Performance</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(topicBreakdown).map(([topId, data]) => {
              const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
              let badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
              let label = 'Weak';
              if (acc >= 70) {
                badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                label = 'Strong';
              } else if (acc >= 40) {
                badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                label = 'Moderate';
              }

              return (
                <div key={topId} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">{data.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      {label} ({acc}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        acc >= 70 ? 'bg-emerald-500' : acc >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${acc}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {data.correct} correct out of {data.total} attempted
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Question by Question Review */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Detailed Question Solutions & Review</h3>
            <p className="text-xs text-slate-500">Step-by-step rationales for every question</p>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl">
            {(['all', 'incorrect', 'correct', 'unattempted'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  filter === tab
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => {
            const originalIndex = questions.findIndex(orig => orig.id === q.id);
            const selected = answers[originalIndex];
            const isUnattempted = selected === undefined || selected === -1;
            const isCorrect = !isUnattempted && selected === q.correctAnswer;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isCorrect
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isUnattempted
                    ? 'border-slate-200 bg-slate-50/40'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500">Q#{originalIndex + 1}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                      isCorrect
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : isUnattempted
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-rose-100 text-rose-800 border-rose-200'
                    }`}>
                      {isCorrect ? 'Correct' : isUnattempted ? 'Unattempted' : 'Incorrect'}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {q.difficulty}
                    </span>
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-900 mb-4">{q.question}</p>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {q.options.map((opt, optIdx) => {
                    const isUserPick = selected === optIdx;
                    const isRightAnswer = optIdx === q.correctAnswer;
                    let optStyle = 'border-slate-200 bg-white text-slate-700';

                    if (isRightAnswer) {
                      optStyle = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                    } else if (isUserPick && !isRightAnswer) {
                      optStyle = 'border-rose-300 bg-rose-50 text-rose-900 line-through';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-3 rounded-xl border text-xs flex items-center space-x-2 ${optStyle}`}
                      >
                        <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                        <span>{opt}</span>
                        {isRightAnswer && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto flex-shrink-0" />}
                        {isUserPick && !isRightAnswer && <XCircle className="w-3.5 h-3.5 text-rose-600 ml-auto flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="p-3.5 rounded-xl bg-slate-100/70 text-xs text-slate-700 space-y-1 border border-slate-200/60">
                  <p className="font-bold text-slate-900 flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>Explanation & Core Concept:</span>
                  </p>
                  <p className="leading-relaxed">{q.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
