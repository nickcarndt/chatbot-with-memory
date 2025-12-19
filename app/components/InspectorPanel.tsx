'use client';

import { useState } from 'react';
import { AGENT_NAMES, type AgentId } from '@/lib/agents';

interface MessageMetadata {
  id: string;
  agentId?: string;
  durationMs?: number;
  requestId?: string;
}

interface InspectorPanelProps {
  selectedMessage: MessageMetadata | null;
  onClose?: () => void;
}

export function InspectorPanel({ selectedMessage, onClose }: InspectorPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="hidden lg:flex flex-col w-80 border-l border-slate-200 bg-white">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Inspector</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-4">
          {selectedMessage ? (
            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium text-slate-700 mb-1">Duration</div>
                <div className="text-sm text-slate-900 font-mono">
                  {selectedMessage.durationMs !== undefined ? `${selectedMessage.durationMs}ms` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-700 mb-1">Agent</div>
                <div className="text-sm text-slate-900">
                  {selectedMessage.agentId
                    ? AGENT_NAMES[selectedMessage.agentId as AgentId] || selectedMessage.agentId
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-700 mb-1">Request ID</div>
                {selectedMessage.requestId ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-slate-900 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200 flex-1 break-all">
                      {selectedMessage.requestId}
                    </code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedMessage.requestId!);
                      }}
                      className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      title="Copy Request ID"
                    >
                      Copy
                    </button>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">—</div>
                )}
              </div>
              <div className="pt-4 border-t border-slate-200">
                <div className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-md p-2">
                  <strong className="text-slate-900">Safety note:</strong> Do not paste secrets, API keys, or PII into conversations.
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <svg
                  className="w-12 h-12 text-slate-300 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-sm text-slate-500">Select an assistant message to inspect</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
