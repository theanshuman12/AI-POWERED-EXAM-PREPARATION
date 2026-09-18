import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({
  message = 'Loading data...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div id="loading-spinner-container" className="flex flex-col items-center justify-center p-8 space-y-3">
      <Loader2 id="spinner-icon" className={`${sizeClasses[size]} animate-spin text-blue-600`} />
      {message && <p id="spinner-text" className="text-sm font-medium text-slate-600">{message}</p>}
    </div>
  );
};

export const ErrorMessage: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry
}) => {
  return (
    <div id="error-message-box" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3">
      <AlertCircle id="error-icon" className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p id="error-text" className="text-sm font-medium">{message}</p>
        {onRetry && (
          <button
            id="retry-button"
            onClick={onRetry}
            className="mt-2 text-xs font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};
