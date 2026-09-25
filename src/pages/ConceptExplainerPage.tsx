import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Subject, Topic } from '../types';
import { api } from '../services/api';
import {
  BrainCircuit,
  Sparkles,
  Search,
  BookOpen,
  Send,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

interface ConceptExplainerPageProps {
  initialTopicName?: string;
  initialSubjectName?: string;
  onPracticeTopic?: (topicName: string) => void;
}

export const ConceptExplainerPage: React.FC<ConceptExplainerPageProps> = ({
  initialTopicName,
  initialSubjectName,
  onPracticeTopic
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(initialSubjectName || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopicName || '');
  const [customQuery, setCustomQuery] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [source, setSource] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadCurriculum = async () => {
      try {
        const [s, t] = await Promise.all([
          api.getSubjects(),
          api.getTopics()
        ]);
        setSubjects(s);
        setTopics(t);

        const subjectToUse = s.find(sub => sub.name === initialSubjectName) || s[0];
        if (subjectToUse) {
          const subjectTopics = t.filter(topic => topic.subjectId === subjectToUse.id);
          const firstTopic = subjectTopics[0];
          setSelectedSubjectId(subjectToUse.id);
          setSelectedSubjectName(subjectToUse.name);
          setSelectedTopicId(firstTopic?.id || '');
          setSelectedTopic(firstTopic?.name || initialTopicName || '');
        }
      } catch (err) {
        console.error('Failed to load curriculum lists:', err);
      }
    };
    loadCurriculum();
  }, [initialSubjectName]);

  useEffect(() => {
    if (!selectedSubjectId || !topics.length) return;
    const subjectTopics = topics.filter(topic => topic.subjectId === selectedSubjectId);
    const existingTopic = subjectTopics.find(topic => topic.name === selectedTopic || topic.id === selectedTopicId);
    const nextTopic = existingTopic || subjectTopics[0];
    if (nextTopic && (nextTopic.id !== selectedTopicId || nextTopic.name !== selectedTopic)) {
      setSelectedTopicId(nextTopic.id);
      setSelectedTopic(nextTopic.name);
    }
  }, [selectedSubjectId, topics, selectedTopic, selectedTopicId]);

  const handleFetchExplanation = async (topicToExplain: string, subjectToExplain?: string, subjectId?: string, topicId?: string) => {
    setLoading(true);
    try {
      const resolvedTopic = topics.find(t => t.id === topicId) || topics.find(t => t.name === topicToExplain);
      const resolvedSubject = subjects.find(s => s.id === subjectId) || subjects.find(s => s.name === subjectToExplain) || subjects.find(s => s.id === selectedSubjectId);
      const topicName = resolvedTopic?.name || topicToExplain;
      const subjectName = resolvedSubject?.name || subjectToExplain || selectedSubjectName;
      const res = await api.explainConcept({
        topicName: topicName,
        subjectName: subjectName,
        subjectId: resolvedSubject?.id || subjectId || selectedSubjectId,
        topicId: resolvedTopic?.id || topicId || selectedTopicId,
        difficulty: 'Undergraduate Exam Level'
      });
      setExplanation(res.explanation);
      setSource(res.source);
      setSelectedTopic(topicName);
      if (resolvedTopic) {
        setSelectedTopicId(resolvedTopic.id);
      }
      if (resolvedSubject) {
        setSelectedSubjectId(resolvedSubject.id);
        setSelectedSubjectName(resolvedSubject.name);
      }
    } catch (err: any) {
      setExplanation(`Failed to retrieve explanation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSubjectId && !selectedSubjectName && !selectedTopic && !selectedTopicId) return;
    if (selectedTopic) {
      handleFetchExplanation(selectedTopic, selectedSubjectName, selectedSubjectId, selectedTopicId);
    }
  }, [selectedSubjectId, selectedTopicId, selectedTopic]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;
    handleFetchExplanation(customQuery.trim());
  };

  return (
    <div id="concept-explainer-page" className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xs space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-bold border border-blue-400/30">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span>Generative AI Study Assistant</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Concept Primer &amp; Revision Notes
        </h1>
        <p className="text-xs sm:text-sm text-blue-200 max-w-2xl leading-relaxed">
          Get crystal-clear theoretical primers, key exam formulas, common traps, and concise 1-minute revision notes for any syllabus topic.
        </p>
      </div>

      {/* Selector & Search Form */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <form onSubmit={handleCustomSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customQuery}
              onChange={e => setCustomQuery(e.target.value)}
              placeholder="Ask about any concept (e.g. BCNF vs 3NF, ACID Properties, Binary Search Trees, Semaphore vs Mutex)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !customQuery.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center space-x-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Study Note</span>
          </button>
        </form>

        {/* Database-backed topic quick-select */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            {selectedSubjectName ? `${selectedSubjectName} Topics:` : 'Topics:'}
          </span>
          <div className="flex flex-wrap gap-2">
            {topics
              .filter(topic => !selectedSubjectId || topic.subjectId === selectedSubjectId)
              .slice(0, 20)
              .map(topic => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId(topic.subjectId);
                    setSelectedTopicId(topic.id);
                    setSelectedTopic(topic.name);
                    handleFetchExplanation(topic.name, selectedSubjectName || subjects.find(s => s.id === topic.subjectId)?.name || '', topic.subjectId, topic.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedTopicId === topic.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {topic.name}
                </button>
              ))}
            {!selectedSubjectId && (
              <span className="text-[11px] text-slate-500">Select a subject to view its topics.</span>
            )}
            {selectedSubjectId && topics.filter(topic => topic.subjectId === selectedSubjectId).length === 0 && (
              <span className="text-[11px] text-slate-500">No topics are available for this subject yet.</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Explanation Result Display */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Concept Dossier</span>
              {source && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Source: {source}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{selectedTopic || 'Select a topic'}</h2>
            {selectedSubjectName && (
              <p className="text-[11px] text-slate-500 font-medium">Subject: {selectedSubjectName}</p>
            )}
          </div>

          {onPracticeTopic && (
            <button
              onClick={() => onPracticeTopic(selectedTopic)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Practice Questions on this Topic</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12">
            <LoadingSpinner message="Consulting academic knowledge base and generating pedagogical notes..." />
          </div>
        ) : selectedSubjectId && topics.filter(topic => topic.subjectId === selectedSubjectId).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            No topics are currently stored for {selectedSubjectName || 'this subject'} in the database. Add topics to the curriculum to enable the AI Study Assistant for this subject.
          </div>
        ) : (
          <div className="markdown-body prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed space-y-4">
            <Markdown>{explanation || 'Select a topic to generate an AI study note.'}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
};
