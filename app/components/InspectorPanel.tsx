'use client';

import { useState, useEffect, useRef } from 'react';
import { AGENT_NAMES, getAgentSystemPrompt, type AgentId } from '@/lib/agents';

interface MessageMetadata {
  id: string;
  agentId?: string;
  durationMs?: number;
  requestId?: string;
}

interface InspectorPanelProps {
  isOpen: boolean;
  selectedMessage: MessageMetadata | null;
  conversationAgentId: string;
  messageCount: number;
  onClose: () => void;
}

export function InspectorPanel({ isOpen, selectedMessage, conversationAgentId, messageCount, onClose }: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState<'conversation' | 'message'>('conversation');
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      firstFocusableRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const systemPrompt = getAgentSystemPrompt(conversationAgentId as AgentId);
  const agentName = AGENT_NAMES[conversationAgentId as AgentId] || 'General Assistant';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Inspector"
        className="fixed top-0 right-0 h-screen w-96 bg-white border-l border-slate-200 shadow-sm z-50 flex flex-col"
      >
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Inspector</h3>
            <button
              ref={firstFocusableRef}
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-1"
              aria-label="Close Inspector"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-md">
            <button
              onClick={() => setActiveTab('conversation')}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === 'conversation'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Conversation
            </button>
            <button
              onClick={() => setActiveTab('message')}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === 'message'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Message
            </button>
          </div>
        </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'conversation' ? (
          <div className="space-y-4">
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
            <div>
              <div className="text-xs font-medium text-slate-700 mb-1">Message Count</div>
              <div className="text-sm text-slate-900">{messageCount}</div>
            </div>
            <div className="pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-600 bg-slate-100 border border-slate-200 rounded-md p-2">
                <strong className="text-slate-900">Safety note:</strong> Do not paste secrets, API keys, or PII into conversations.
              </div>
            </div>
          </div>
        ) : (
          <div>
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
      </div>
    </>
  );
}
