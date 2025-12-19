'use client';

import { AGENT_NAMES, getAgentSystemPrompt, type AgentId } from '@/lib/agents';
import { useState } from 'react';

interface EvalModePanelProps {
  agentId: string;
  messageCount: number;
}

export function EvalModePanel({ agentId, messageCount }: EvalModePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const systemPrompt = getAgentSystemPrompt(agentId as AgentId);
  const agentName = AGENT_NAMES[agentId as AgentId] || 'General Assistant';

  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-900">Inspector</span>
          <span className="text-xs text-slate-500">({messageCount} messages)</span>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-6 py-4 space-y-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 mb-2">
            Shows how the assistant is configured for this conversation.
          </div>
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1">Agent</div>
            <div className="text-sm text-slate-900">{agentName}</div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-700 mb-1">System Prompt</div>
            <div className="text-sm text-slate-600 bg-white border border-slate-200 rounded-md p-3 font-mono whitespace-pre-wrap">
              {systemPrompt}
            </div>
          </div>
          <div className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-md p-2">
            <strong className="text-slate-900">Safety note:</strong> Do not paste secrets, API keys, or PII into conversations.
          </div>
        </div>
      )}
    </div>
  );
}
