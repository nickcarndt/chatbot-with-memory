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
        <div className="flex items-center gap-2">
          <button
            onClick={onEvalModeToggle}
            role="switch"
            aria-checked={evalMode}
            aria-label="Inspector"
            title="Inspect system prompt + message metadata"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md px-2 py-1 -mx-2 hover:bg-slate-50 transition-colors group"
          >
            <span className="text-sm text-slate-600">Inspector</span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium leading-none ${
                evalMode ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {evalMode ? 'ON' : 'OFF'}
            </span>
            <div
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                evalMode ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  evalMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
