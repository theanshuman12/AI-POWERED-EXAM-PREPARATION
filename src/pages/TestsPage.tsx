import React, { useState, useEffect } from 'react';
import { Exam, Test, Subject } from '../types';
import { api } from '../services/api';
import {
  HelpCircle,
  Clock,
  Award,
  Layers,
  Sparkles,
  Play,
  CheckCircle2,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface TestsPageProps {
  onStartQuiz: (params: { testId?: string; subjectId?: string; topicId?: string; difficulty?: string }) => void;
}

export const TestsPage: React.FC<TestsPageProps> = ({ onStartQuiz }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Custom Quick Drill generator state
  const [customSubject, setCustomSubject] = useState<string>('');
  const [customDifficulty, setCustomDifficulty] = useState<string>('Medium');

  useEffect(() => {
    const fetchTests = async () => {
      setLoading(true);
      try {
        const [examData, testsData, subs] = await Promise.all([
          api.getExams(),
          api.getTests(),
          api.getSubjects()
        ]);
        setExams(examData);
        setTests(testsData);
        setSubjects(subs);
        if (examData.length > 0) setSelectedExamId(examData[0].id);
        if (subs.length > 0) {
          setCustomSubject(subs.find(subject => subject.examId === examData[0]?.id)?.id || subs[0].id);
        }
      } catch (err) {
        console.error('Failed to load mock tests:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Retrieving curriculum mock tests & exams..." />
      </div>
    );
  }

  return (
    <div id="mock-tests-page-container" className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Curated Mock Tests &amp; Practice Quizzes
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
          Simulate real exam conditions with timed mock tests or configure dynamic custom practice quizzes.
          All performance metrics seamlessly feed the AI Recommendation Engine.
        </p>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {exams.map(exam => (
          <button
            key={exam.id}
            onClick={() => {
              setSelectedExamId(exam.id);
              setCustomSubject(subjects.find(subject => subject.examId === exam.id)?.id || '');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${selectedExamId === exam.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
          >
            {exam.name}
          </button>
        ))}
      </div>

      {/* Quick Custom Drill Generator Card */}
      <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 rounded-3xl p-6 sm:p-7 border border-blue-100 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Custom Rapid Practice Drill
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Subject</label>
            <select
              value={customSubject}
              onChange={e => setCustomSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
            >
              {subjects.filter(subject => subject.examId === selectedExamId).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Target Difficulty</label>
            <select
              value={customDifficulty}
              onChange={e => setCustomDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="Easy">Easy (Fundamental)</option>
              <option value="Medium">Medium (Balanced)</option>
              <option value="Hard">Hard (Advanced / Gate level)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              id="start-custom-drill-btn"
              onClick={() => onStartQuiz({ subjectId: customSubject, difficulty: customDifficulty })}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Launch Practice Quiz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Standard Mock Tests List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Standard Full-Length Mock Examinations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tests
            .filter(test => subjects.some(subject => subject.id === test.subjectId && subject.examId === selectedExamId))
            .map(test => (
            <div
              key={test.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                    test.difficulty === 'Hard'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : test.difficulty === 'Easy'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {test.difficulty} Test
                  </span>

                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{test.duration} mins</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>{test.questions.length} Qs</span>
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {test.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Multi-topic standardized evaluation with timed questions and instant performance feedback.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  Instant AI Feedback
                </span>
                <button
                  id={`start-test-btn-${test.id}`}
                  onClick={() => onStartQuiz({ testId: test.id })}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <span>Start Mock Test</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
