'use client';

export function LoadingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span>Assistant is thinking…</span>
        </div>
      </div>
    </div>
  );
}
