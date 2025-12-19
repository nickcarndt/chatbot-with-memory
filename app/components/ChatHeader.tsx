'use client';

import { AGENT_NAMES, type AgentId } from '@/lib/agents';

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
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
            {AGENT_NAMES[agentId as AgentId] || 'General Assistant'}
          </span>
        </div>
        <button
          onClick={onEvalModeToggle}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            evalMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Eval Mode {evalMode ? 'ON' : 'OFF'}
        </button>
      </div>
    </div>
  );
}
