import React, { useState, useEffect, useRef } from 'react';
import { Question, Subject, Topic } from '../types';
import { api } from '../services/api';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Send,
  HelpCircle
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface QuizPageProps {
  testId?: string;
  subjectId?: string;
  topicId?: string;
  difficulty?: string;
  onFinishQuiz: (resultData: any) => void;
  onExitQuiz: () => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({
  testId,
  subjectId,
  topicId,
  difficulty,
  onFinishQuiz,
  onExitQuiz
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // index -> selected option index
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [responseTimes, setResponseTimes] = useState<Record<number, number>>({}); // seconds per question
  const [secondsRemaining, setSecondsRemaining] = useState<number>(600); // 10 mins default
  const [totalTimeTaken, setTotalTimeTaken] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [quizTitle, setQuizTitle] = useState<string>('Exam Practice Session');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState<boolean>(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [isPaperMock, setIsPaperMock] = useState<boolean>(false);

  const questionStartTimeRef = useRef<number>(Date.now());
  const sessionStorageKey = testId ? `ai_prep_quiz_${testId}` : null;

  // Load quiz questions
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        if (testId) {
          const testData = await api.getTest(testId);
          setQuestions(testData.questionDetails || []);
          setQuizTitle(testData.title);
          setIsPaperMock(testData.subjectId === 'subj-uppet-paper-mock');
          if (sessionStorageKey) {
            const savedSession = localStorage.getItem(sessionStorageKey);
            if (savedSession) {
              try {
                const parsed = JSON.parse(savedSession);
                setAnswers(parsed.answers || {});
                setFlagged(parsed.flagged || {});
                setResponseTimes(parsed.responseTimes || {});
                setCurrentIndex(parsed.currentIndex || 0);
                setTotalTimeTaken(parsed.totalTimeTaken || 0);
              } catch {
                localStorage.removeItem(sessionStorageKey);
              }
            }
          }
          setSecondsRemaining((testData.duration || 15) * 60);
        } else {
          const practice = await api.startPractice({
            subjectId,
            topicId,
            difficulty,
            count: 10
          });
          setQuestions(practice.questions);
          setQuizTitle(practice.sessionTitle);
          setSecondsRemaining(practice.duration * 60);
        }
      } catch (err) {
        console.error('Failed to load quiz questions:', err);
      } finally {
        setLoading(false);
        questionStartTimeRef.current = Date.now();
      }
    };

    fetchQuestions();
  }, [testId, subjectId, topicId, difficulty]);

  useEffect(() => {
    if (!sessionStorageKey || loading || questions.length === 0 || submitting) return;
    localStorage.setItem(sessionStorageKey, JSON.stringify({ answers, flagged, responseTimes, currentIndex, totalTimeTaken }));
  }, [answers, flagged, responseTimes, currentIndex, totalTimeTaken, loading, questions.length, submitting, sessionStorageKey]);

  // Timer interval
  useEffect(() => {
    if (loading || questions.length === 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
      setTotalTimeTaken(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, questions.length]);

  // Record response time on question change
  const recordCurrentResponseTime = () => {
    const now = Date.now();
    const elapsedSeconds = Math.round((now - questionStartTimeRef.current) / 1000);
    setResponseTimes(prev => ({
      ...prev,
      [currentIndex]: (prev[currentIndex] || 0) + Math.max(1, elapsedSeconds)
    }));
    questionStartTimeRef.current = Date.now();
  };

  const handleSelectOption = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleToggleFlag = () => {
    setFlagged(prev => ({ ...prev, [currentIndex]: !prev[currentIndex] }));
  };

  const handleNavigate = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= questions.length) return;
    recordCurrentResponseTime();
    setCurrentIndex(newIndex);
    setShowHint(false);
    setHintText(null);
  };

  const handleFetchHint = async () => {
    if (hintText) {
      setShowHint(prev => !prev);
      return;
    }
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setLoadingHint(true);
    try {
      const res = await api.getQuestionHint({
        question: currentQ.question,
        options: currentQ.options
      });
      setHintText(res.hint);
      setShowHint(true);
    } catch (e) {
      setHintText('Consider the underlying definition or conditions that distinguish each choice.');
      setShowHint(true);
    } finally {
      setLoadingHint(false);
    }
  };

  const handleSubmitQuiz = async () => {
    recordCurrentResponseTime();
    setSubmitting(true);
    try {
      const formattedAnswers = questions.map((q, idx) => ({
        questionId: q.id,
        selectedAnswer: answers[idx] !== undefined ? answers[idx] : -1,
        responseTime: responseTimes[idx] || 25
      }));

      const result = await api.submitTest({
        testId: testId || undefined,
        title: quizTitle,
        subjectId: questions[0]?.subjectId || 'subj-dbms',
        timeTaken: totalTimeTaken,
        answers: formattedAnswers
      });

      if (sessionStorageKey) localStorage.removeItem(sessionStorageKey);

      onFinishQuiz({
        ...result,
        questions,
        answers,
        timeTaken: totalTimeTaken
      });
    } catch (err: any) {
      console.error('Error submitting quiz:', err);
      alert('Error submitting quiz: ' + err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner message="Assembling questions and initializing session..." />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No Questions Found</h3>
        <p className="text-sm text-slate-600">
          No questions were found matching the selected subject and topic criteria.
        </p>
        <button
          onClick={onExitQuiz}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700"
        >
          Return to Subjects
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div id="quiz-page-container" className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {isPaperMock && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-1">
          <h3 className="font-bold">UPPET Paper Mock - Marking Scheme</h3>
          <p>Total Questions: 100</p>
          <p>Total Marks: 100</p>
          <p>Correct Answer: +1 mark</p>
          <p>Wrong Answer: -0.25 mark</p>
          <p>Unattempted: 0 mark</p>
        </div>
      )}
      {/* Quiz Top Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              {currentQ?.difficulty} Difficulty
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">{quizTitle}</h2>
        </div>

        <div className="flex items-center space-x-4">
          {/* Countdown Timer */}
          <div className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border ${
            secondsRemaining < 120
              ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
              : 'bg-slate-100 text-slate-700 border-slate-200'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <button
            id="finish-quiz-early-btn"
            onClick={() => setShowSubmitConfirm(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Quiz</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Question Display */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-blue-600">Question #{currentIndex + 1}</span>
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                  {currentQ?.question}
                </h3>
              </div>
              <button
                id="flag-question-button"
                onClick={handleToggleFlag}
                title={flagged[currentIndex] ? 'Unmark review' : 'Mark for review'}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  flagged[currentIndex]
                    ? 'bg-amber-50 border-amber-300 text-amber-600'
                    : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Flag className={`w-4 h-4 ${flagged[currentIndex] ? 'fill-amber-500' : ''}`} />
              </button>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-3">
              {currentQ?.options.map((optionText, optIdx) => {
                const isSelected = answers[currentIndex] === optIdx;
                const letter = String.fromCharCode(65 + optIdx);
                return (
                  <button
                    key={optIdx}
                    id={`quiz-option-${optIdx}`}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center space-x-3.5 cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-950 font-medium shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {letter}
                    </span>
                    <span className="text-sm leading-snug flex-1">{optionText}</span>
                  </button>
                );
              })}
            </div>

            {/* AI Pedagogical Hint Toggle */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <button
                  id="ai-hint-button"
                  onClick={handleFetchHint}
                  disabled={loadingHint}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1.5 py-1 px-2.5 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>{loadingHint ? 'Thinking...' : showHint ? 'Hide AI Hint' : 'Stuck? Get Pedagogical Hint'}</span>
                </button>

                {answers[currentIndex] !== undefined && (
                  <span className="text-xs font-medium text-emerald-600 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Answer saved</span>
                  </span>
                )}
              </div>

              {showHint && hintText && (
                <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900 leading-relaxed animate-in fade-in duration-200">
                  <p className="font-semibold text-indigo-950 mb-1 flex items-center space-x-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mentor Guidance (Hint):</span>
                  </p>
                  {hintText}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2">
            <button
              id="quiz-prev-button"
              onClick={() => handleNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all ${
                currentIndex === 0
                  ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-xs'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                id="quiz-final-submit-button"
                onClick={() => setShowSubmitConfirm(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center space-x-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <span>Complete & Evaluate</span>
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                id="quiz-next-button"
                onClick={() => handleNavigate(currentIndex + 1)}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Question Palette
            </h4>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[idx] !== undefined;
                const isFlagged = flagged[idx];

                let bgClass = 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100';
                if (isCurrent) {
                  bgClass = 'bg-blue-600 text-white border-blue-600 font-bold ring-2 ring-blue-200';
                } else if (isFlagged) {
                  bgClass = 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
                } else if (isAnswered) {
                  bgClass = 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
                }

                return (
                  <button
                    key={idx}
                    id={`palette-btn-${idx}`}
                    onClick={() => handleNavigate(idx)}
                    className={`h-9 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer relative ${bgClass}`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-300 inline-block" />
                  <span>Answered</span>
                </span>
                <span className="font-bold text-slate-900">{answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-300 inline-block" />
                  <span>Unattempted</span>
                </span>
                <span className="font-bold text-slate-900">{questions.length - answeredCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-xs bg-amber-100 border border-amber-300 inline-block" />
                  <span>Marked for Review</span>
                </span>
                <span className="font-bold text-slate-900">{Object.values(flagged).filter(Boolean).length}</span>
              </div>
            </div>

            <button
              onClick={onExitQuiz}
              className="w-full text-center py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            >
              Quit & Exit Practice
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Confirm Exam Submission</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              You have answered <span className="font-bold text-slate-900">{answeredCount}</span> out of <span className="font-bold text-slate-900">{questions.length}</span> questions.
              {questions.length - answeredCount > 0 && (
                <span className="block mt-1 text-amber-600 font-medium">
                  Note: {questions.length - answeredCount} question(s) remain unattempted.
                </span>
              )}
            </p>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
              >
                Continue Answering
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
              >
                {submitting ? 'Evaluating...' : 'Yes, Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
