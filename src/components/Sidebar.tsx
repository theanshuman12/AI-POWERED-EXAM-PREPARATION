import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Sparkles,
  BarChart3,
  History,
  FileText,
  UserCheck,
  FolderTree,
  ListOrdered,
  Users,
  BrainCircuit,
  Info
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

interface SidebarLink {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  if (!user) return null;

  const studentLinks: SidebarLink[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'subjects', label: 'Subjects & Topics', icon: BookOpen },
    { id: 'tests', label: 'Mock Tests & Quizzes', icon: HelpCircle },
    { id: 'recommendations', label: 'AI Recommendations', icon: Sparkles, badge: 'Adaptive' },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart3 },
    { id: 'history', label: 'Attempt History', icon: History },
    { id: 'concept-explainer', label: 'AI Study Assistant', icon: BrainCircuit }
  ];

  const adminLinks: SidebarLink[] = [
    { id: 'admin-dashboard', label: 'Admin Overview', icon: LayoutDashboard },
    { id: 'admin-students', label: 'Manage Students', icon: Users },
    { id: 'admin-subjects', label: 'Manage Subjects', icon: BookOpen },
    { id: 'admin-topics', label: 'Manage Topics', icon: FolderTree },
    { id: 'admin-questions', label: 'Question Bank', icon: ListOrdered },
    { id: 'admin-tests', label: 'Manage Mock Tests', icon: FileText }
  ];

  const links = user.role === 'admin' ? adminLinks : studentLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div className="p-4 space-y-6">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              {user.role === 'admin' ? 'Administration' : 'Student Portal'}
            </p>
            <nav className="space-y-1">
              {links.map(link => {
                const Icon = link.icon;
                const isActive = activeView === link.id;
                return (
                  <button
                    key={link.id}
                    id={`sidebar-link-${link.id}`}
                    onClick={() => {
                      setActiveView(link.id);
                      if (onClose) onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                        {link.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Academic Model Viva Notice */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <div className="flex items-center space-x-1.5 text-slate-800 font-semibold">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Viva & Project Info</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Uses an explainable heuristic model:
              <br />
              <code className="text-blue-600 font-mono text-[10px]">
                0.50*Acc + 0.30*Recent + 0.20*Time
              </code>
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Database Connected</span>
          </div>
        </div>
      </aside>
    </>
  );
};
