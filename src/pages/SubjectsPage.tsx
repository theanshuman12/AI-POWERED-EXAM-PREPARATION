import React, { useState, useEffect } from 'react';
import { Exam, Subject, Topic } from '../types';
import { api } from '../services/api';
import {
  BookOpen,
  FolderTree,
  Play,
  BrainCircuit,
  Search,
  Filter,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface SubjectsPageProps {
  initialSubjectId?: string;
  onStartPractice: (params: { subjectId: string; topicId?: string; difficulty?: string }) => void;
  onOpenConceptExplainer: (topicName: string, subjectName: string) => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  initialSubjectId,
  onStartPractice,
  onOpenConceptExplainer
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || '');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Medium');
  const [selectedExamId, setSelectedExamId] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [examData, subs, tops] = await Promise.all([
          api.getExams(),
          api.getSubjects(),
          api.getTopics()
        ]);
        setExams(examData);
        setSubjects(subs);
        if (examData.length > 0) setSelectedExamId(examData[0].id);
        setTopics(tops);
        if (!selectedSubjectId && subs.length > 0) {
          setSelectedSubjectId(subs[0].id);
        }
      } catch (err) {
        console.error('Failed to load curriculum:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Loading curriculum subjects & topic syllabi..." />
      </div>
    );
  }

  const examSubjects = subjects.filter(subject => subject.examId === selectedExamId);
  const activeSubject = examSubjects.find(s => s.id === selectedSubjectId) || examSubjects[0];
  const subjectTopics = topics.filter(t => t.subjectId === selectedSubjectId);
  const filteredTopics = subjectTopics.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="subjects-page-container" className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Curriculum Subjects &amp; Topic Syllabus
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
          Select a subject to explore its academic syllabus, trigger targeted topic practice sessions, or launch the AI Concept Study Assistant.
        </p>
      </div>

      {/* Exam Navigation */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {exams.map(exam => (
          <button
            key={exam.id}
            onClick={() => {
              setSelectedExamId(exam.id);
              setSelectedSubjectId('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer ${selectedExamId === exam.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
          >
            {exam.name}
          </button>
        ))}
      </div>

      {/* Subject Navigation Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {examSubjects.map(subj => {
          const isSelected = subj.id === selectedSubjectId;
          return (
            <button
              key={subj.id}
              id={`subject-pill-${subj.id}`}
              onClick={() => setSelectedSubjectId(subj.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-2 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
              <span>{subj.name.split('(')[0].trim()}</span>
            </button>
          );
        })}
      </div>

      {/* Active Subject Details */}
      {activeSubject && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Selected Subject
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{activeSubject.name}</h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                {activeSubject.description}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                id="practice-whole-subject-btn"
                onClick={() => onStartPractice({ subjectId: activeSubject.id, difficulty: selectedDifficulty })}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2 shadow-xs transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Practice Full Subject ({selectedDifficulty})</span>
              </button>
            </div>
          </div>

          {/* Search & Difficulty Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search topics..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
              />
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <span className="text-xs font-semibold text-slate-500">Practice Difficulty:</span>
              <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl">
                {['Easy', 'Medium', 'Hard'].map(diff => (
                  <button
                    key={diff}
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedDifficulty === diff
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTopics.map(topic => (
              <div
                key={topic.id}
                className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:bg-slate-50/50 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      Topic Module
                    </span>
                    <button
                      onClick={() => onOpenConceptExplainer(topic.name, activeSubject.name)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 cursor-pointer"
                      title="Generate study notes & explanation"
                    >
                      <BrainCircuit className="w-3.5 h-3.5" />
                      <span>Study Concept</span>
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {topic.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400">
                    Difficulty: <strong className="text-slate-700">{selectedDifficulty}</strong>
                  </span>
                  <button
                    id={`practice-topic-${topic.id}`}
                    onClick={() => onStartPractice({ subjectId: activeSubject.id, topicId: topic.id, difficulty: selectedDifficulty })}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all flex items-center space-x-1 cursor-pointer border border-blue-200 hover:border-transparent"
                  >
                    <span>Practice Topic</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
