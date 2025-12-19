'use client';

import { useState } from 'react';
import { AGENT_NAMES, type AgentId } from '@/lib/agents';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  agentId?: string;
  durationMs?: number;
  requestId?: string;
}

export function MessageBubble({ role, content, agentId, durationMs, requestId }: MessageBubbleProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72ch] rounded-lg px-4 py-3 bg-blue-600 text-white">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[72ch] rounded-lg bg-white border border-slate-200 text-slate-900 shadow-sm">
        <div className="px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </div>
        <div className="border-t border-slate-200">
          <button
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <span>Details</span>
            <svg
              className={`w-3 h-3 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isDetailsOpen && (
            <div className="px-4 pb-3 space-y-1.5 text-xs">
              {durationMs !== undefined ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="text-slate-900 font-mono">{durationMs}ms</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="text-slate-400 italic">Not available</span>
                </div>
              )}
              {agentId ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Agent:</span>
                  <span className="text-slate-900">{AGENT_NAMES[agentId as AgentId] || agentId}</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-500">Agent:</span>
                  <span className="text-slate-400 italic">Not available</span>
                </div>
              )}
              {requestId ? (
                <div className="flex justify-between">
                  <span className="text-slate-500">Request ID:</span>
                  <span className="text-slate-900 font-mono text-[10px]">{requestId}</span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-slate-500">Request ID:</span>
                  <span className="text-slate-400 italic">Not available</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
