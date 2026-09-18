import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GraduationCap,
  Sparkles,
  User as UserIcon,
  LogOut,
  Menu
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  activeView,
  setActiveView
}) => {
  const { user, logout } = useAuth();

  return (
    <header id="main-header" className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {user && (
            <button
              id="sidebar-toggle-button"
              onClick={onToggleSidebar}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div
            id="app-logo-badge"
            onClick={() => setActiveView(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'admin-dashboard' : 'dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-slate-900 text-base tracking-tight font-display">AI POWER</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">EXAM PREP</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-none">Smart Academic Preparation Platform</p>
            </div>
          </div>
        </div>

        {/* Right Section / Controls */}
        <div className="flex items-center space-x-3">
          {!user ? (
            <div className="flex items-center space-x-2">
              <button
                id="nav-login-btn"
                onClick={() => setActiveView('login')}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              {/* Quick AI Recommendations button */}
              {user.role === 'USER' && (
                <button
                  id="nav-ai-rec-quick-btn"
                  onClick={() => setActiveView('recommendations')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all ${
                    activeView === 'recommendations'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                  <span>AI Recommendations</span>
                </button>
              )}

              {/* User profile info & Logout */}
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <div className="flex items-center space-x-2 text-left">
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                      user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  id="user-logout-btn"
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
