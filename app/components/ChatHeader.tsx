'use client';

import { Badge } from './Badge';

interface ChatHeaderProps {
  title: string;
  agentId: string;
  evalMode: boolean;
  onEvalModeToggle: () => void;
}

export function ChatHeader({ title, agentId, evalMode, onEvalModeToggle }: ChatHeaderProps) {
  return (
    <div className="px-6 py-4 border-b border-slate-200 bg-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <Badge agentId={agentId} variant="light" />
        </div>
        <button
          onClick={onEvalModeToggle}
          aria-pressed={evalMode}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            evalMode ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              evalMode ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
          <span className="sr-only">Eval Mode {evalMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>
    </div>
  );
}
