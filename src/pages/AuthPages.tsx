import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Lock,
  Mail,
  User as UserIcon
} from 'lucide-react';

interface AuthPagesProps {
  initialMode?: 'login' | 'register';
  onSuccess: () => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialMode = 'login',
  onSuccess
}) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [requestAdminAccess, setRequestAdminAccess] = useState<boolean>(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
        if (requestAdminAccess) {
          await api.submitAdminRequest();
          setRequestStatus('Your Admin request has been submitted and is awaiting approval from the Super Admin.');
        }
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-container" className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-sm">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-display">
            {mode === 'login' ? 'Sign in to AI Exam Prep' : 'Create Student Account'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Enter your credentials to access smart recommendations and analytics'
              : 'Sign up to begin your smart exam preparation journey'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="flex items-center gap-2 font-bold text-slate-700">
                <input type="checkbox" checked={requestAdminAccess} onChange={e => setRequestAdminAccess(e.target.checked)} />
                Request Admin Access
              </label>
              <p className="mt-1 text-[11px] text-slate-500">Your account remains a USER until the Super Admin approves your request.</p>
            </div>
          )}

          {requestStatus && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-3">{requestStatus}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Portal' : 'Complete Registration'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500">
          {mode === 'login' ? (
            <p>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
