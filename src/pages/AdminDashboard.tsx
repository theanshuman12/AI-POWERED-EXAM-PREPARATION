import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Subject, Topic, Question, User, Test } from '../types';
import {
  Users,
  BookOpen,
  FolderTree,
  ListOrdered,
  FileText,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Search,
  Filter,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'questions' | 'subjects' | 'tests'>('overview');
  const [students, setStudents] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New Question Form state
  const [showAddQuestionModal, setShowAddQuestionModal] = useState<boolean>(false);
  const [newSubjectId, setNewSubjectId] = useState<string>('');
  const [newTopicId, setNewTopicId] = useState<string>('');
  const [newQuestionText, setNewQuestionText] = useState<string>('');
  const [newOptionA, setNewOptionA] = useState<string>('');
  const [newOptionB, setNewOptionB] = useState<string>('');
  const [newOptionC, setNewOptionC] = useState<string>('');
  const [newOptionD, setNewOptionD] = useState<string>('');
  const [newCorrectAnswer, setNewCorrectAnswer] = useState<number>(0);
  const [newExplanation, setNewExplanation] = useState<string>('');
  const [newDifficulty, setNewDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');

  // Search & filter
  const [questionSearch, setQuestionSearch] = useState<string>('');

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [stuRes, subRes, topRes, qRes, tRes] = await Promise.all([
        api.getAllStudents(),
        api.getSubjects(),
        api.getTopics(),
        api.getQuestions(),
        api.getTests()
      ]);
      setStudents(stuRes.users);
      setSubjects(subRes);
      setTopics(topRes);
      setQuestions(qRes);
      setTests(tRes);
      if (subRes.length > 0) {
        setNewSubjectId(subRes[0].id);
      }
      if (topRes.length > 0) {
        setNewTopicId(topRes[0].id);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText || !newOptionA || !newOptionB || !newOptionC || !newOptionD) {
      alert('Please fill out question text and all four options.');
      return;
    }

    try {
      const created = await api.createQuestion({
        subjectId: newSubjectId,
        topicId: newTopicId,
        question: newQuestionText,
        options: [newOptionA, newOptionB, newOptionC, newOptionD],
        correctAnswer: newCorrectAnswer,
        explanation: newExplanation || 'Correct mathematical / theoretical principle applies.',
        difficulty: newDifficulty
      });

      setQuestions(prev => [created, ...prev]);
      setShowAddQuestionModal(false);
      setNewQuestionText('');
      setNewOptionA('');
      setNewOptionB('');
      setNewOptionC('');
      setNewOptionD('');
      setNewExplanation('');
      alert('Question added successfully to Question Bank!');
    } catch (err: any) {
      alert('Error creating question: ' + err.message);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.deleteQuestion(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err: any) {
      alert('Failed to delete question: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Loading administrative portal and question repository..." />
      </div>
    );
  }

  const filteredQuestions = questions.filter(q =>
    q.question.toLowerCase().includes(questionSearch.toLowerCase()) ||
    q.topicId.toLowerCase().includes(questionSearch.toLowerCase())
  );

  return (
    <div id="admin-dashboard-container" className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Admin Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Control Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Academic Management Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
            Manage curriculum questions, mock test papers, syllabi, and monitor student preparation analytics.
          </p>
        </div>

        <button
          onClick={() => setShowAddQuestionModal(true)}
          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'System Overview', icon: Layers },
          { id: 'questions', label: `Question Bank (${questions.length})`, icon: ListOrdered },
          { id: 'students', label: `Students (${students.length})`, icon: Users },
          { id: 'subjects', label: `Subjects (${subjects.length})`, icon: BookOpen },
          { id: 'tests', label: `Mock Tests (${tests.length})`, icon: FileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-2 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: System Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
              <p className="text-xs font-semibold text-slate-500">Total Questions</p>
              <p className="text-2xl font-black text-slate-900 font-display">{questions.length}</p>
              <span className="text-[11px] text-slate-400">Across {topics.length} topics</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
              <p className="text-xs font-semibold text-slate-500">Enrolled Students</p>
              <p className="text-2xl font-black text-blue-600 font-display">{students.length}</p>
              <span className="text-[11px] text-slate-400">Active accounts</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
              <p className="text-xs font-semibold text-slate-500">Curriculum Subjects</p>
              <p className="text-2xl font-black text-emerald-600 font-display">{subjects.length}</p>
              <span className="text-[11px] text-slate-400">DBMS, DSA, OS, CN, SE</span>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
              <p className="text-xs font-semibold text-slate-500">Standard Tests</p>
              <p className="text-2xl font-black text-indigo-600 font-display">{tests.length}</p>
              <span className="text-[11px] text-slate-400">Full mock examinations</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Curriculum Health &amp; Subject Question Distribution
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjects.map(s => {
                const qCount = questions.filter(q => q.subjectId === s.id).length;
                const topCount = topics.filter(t => t.subjectId === s.id).length;
                return (
                  <div key={s.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900">{s.name}</h4>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{topCount} Topics</span>
                      <span className="font-bold text-blue-600">{qCount} Questions</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Question Bank */}
      {activeTab === 'questions' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={questionSearch}
                onChange={e => setQuestionSearch(e.target.value)}
                placeholder="Search questions by text or topic..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowAddQuestionModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Question</span>
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredQuestions.map(q => (
              <div key={q.id} className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        q.difficulty === 'Hard'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : q.difficulty === 'Easy'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {q.difficulty}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{q.topicId}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{q.question}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {q.options.map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className={`p-2 rounded-lg border ${
                        oIdx === q.correctAnswer
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      <span className="font-bold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                      <span>{opt}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <strong className="text-slate-700">Explanation:</strong> {q.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Students */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Registered Student Accounts &amp; Access Roles
          </h3>

          <div className="divide-y divide-slate-100">
            {students.map(s => (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{s.name}</p>
                    <span className="text-[11px] text-slate-500">{s.email}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  s.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {s.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Subjects & Topics */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subjects.map(subj => {
            const subsTopics = topics.filter(t => t.subjectId === subj.id);
            return (
              <div key={subj.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-base font-bold text-slate-900">{subj.name}</h3>
                <p className="text-xs text-slate-500">{subj.description}</p>
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Topics Included ({subsTopics.length}):
                  </span>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {subsTopics.map(t => (
                      <li key={t.id} className="flex items-center space-x-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>{t.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Question Modal */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Question to Bank</h3>
              <button
                onClick={() => setShowAddQuestionModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Subject</label>
                  <select
                    value={newSubjectId}
                    onChange={e => setNewSubjectId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Topic</label>
                  <select
                    value={newTopicId}
                    onChange={e => setNewTopicId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    {topics.filter(t => !newSubjectId || t.subjectId === newSubjectId).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty</label>
                  <select
                    value={newDifficulty}
                    onChange={e => setNewDifficulty(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Question Text</label>
                <textarea
                  rows={3}
                  value={newQuestionText}
                  onChange={e => setNewQuestionText(e.target.value)}
                  placeholder="Enter complete exam question statement..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Four Options</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="font-bold text-slate-500 mb-0.5 block">Option A</span>
                    <input
                      type="text"
                      value={newOptionA}
                      onChange={e => setNewOptionA(e.target.value)}
                      placeholder="Choice A..."
                      className="w-full p-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 mb-0.5 block">Option B</span>
                    <input
                      type="text"
                      value={newOptionB}
                      onChange={e => setNewOptionB(e.target.value)}
                      placeholder="Choice B..."
                      className="w-full p-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 mb-0.5 block">Option C</span>
                    <input
                      type="text"
                      value={newOptionC}
                      onChange={e => setNewOptionC(e.target.value)}
                      placeholder="Choice C..."
                      className="w-full p-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 mb-0.5 block">Option D</span>
                    <input
                      type="text"
                      value={newOptionD}
                      onChange={e => setNewOptionD(e.target.value)}
                      placeholder="Choice D..."
                      className="w-full p-2 rounded-xl border border-slate-200"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Correct Answer</label>
                  <select
                    value={newCorrectAnswer}
                    onChange={e => setNewCorrectAnswer(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value={0}>Option A</option>
                    <option value={1}>Option B</option>
                    <option value={2}>Option C</option>
                    <option value={3}>Option D</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Explanation</label>
                  <input
                    type="text"
                    value={newExplanation}
                    onChange={e => setNewExplanation(e.target.value)}
                    placeholder="Pedagogical rationale / rule..."
                    className="w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  Save Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
