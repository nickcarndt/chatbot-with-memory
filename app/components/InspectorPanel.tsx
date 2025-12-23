'use client';

import { useState, useEffect, useRef } from 'react';
import { AGENT_NAMES, getAgentSystemPrompt, type AgentId } from '@/lib/agents';

interface MessageMetadata {
  id: string;
  meta?: {
    requestId?: string;
    durationMs?: number;
    agentId?: string;
    model?: string;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
  };
}

interface InspectorPanelProps {
  isOpen: boolean;
  selectedMessage: MessageMetadata | null;
  conversationAgentId: string;
  messageCount: number;
  activeTab: 'conversation' | 'message';
  onClose: () => void;
  onTabChange: (tab: 'conversation' | 'message') => void;
}

export function InspectorPanel({ isOpen, selectedMessage, conversationAgentId, messageCount, activeTab, onTabChange, onClose }: InspectorPanelProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const [copied, setCopied] = useState(false);

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
              onClick={() => onTabChange('conversation')}
              className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                activeTab === 'conversation'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Conversation
            </button>
            <button
              onClick={() => onTabChange('message')}
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
                    {selectedMessage.meta?.durationMs !== undefined ? `${selectedMessage.meta.durationMs}ms` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-700 mb-1">Agent</div>
                  <div className="text-sm text-slate-900">
                    {selectedMessage.meta?.agentId
                      ? AGENT_NAMES[selectedMessage.meta.agentId as AgentId] || selectedMessage.meta.agentId
                      : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-700 mb-1">Request ID</div>
                  {selectedMessage.meta?.requestId ? (
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-slate-900 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-200 flex-1 break-all">
                        {selectedMessage.meta.requestId}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(selectedMessage.meta!.requestId!);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1200);
                        }}
                        className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title="Copy Request ID"
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400">—</div>
                  )}
                </div>
                {Array.isArray((selectedMessage.meta as any)?.toolTrace) ? (
                  <div className="pt-4 border-t border-slate-200 space-y-2">
                    <div className="text-xs font-medium text-slate-700 mb-1">Tool Trace</div>
                    <div className="space-y-2">
                      {(selectedMessage.meta as any).toolTrace.map((entry: any, idx: number) => {
                        const ok = entry?.ok === true;
                        const tool = entry?.tool || 'unknown';
                        const duration = typeof entry?.durationMs === 'number' ? `${entry.durationMs}ms` : '—';
                        const at = typeof entry?.at === 'string' ? entry.at : '—';
                        const outputPreview = entry?.outputPreview ?? '';
                        const inputPreview = entry?.inputPreview ?? '';
                        return (
                          <div
                            key={idx}
                            className="border border-slate-200 rounded-md bg-slate-50 px-3 py-2 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <code className="text-xs text-slate-900 font-mono break-all">{tool}</code>
                              <span
                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                  ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {ok ? 'ok' : 'fail'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex items-center gap-3">
                              <span>{duration}</span>
                              <span className="text-slate-400">•</span>
                              <span className="truncate" title={at}>{at}</span>
                            </div>
                            {outputPreview ? (
                              <div className="text-[11px] text-slate-600 font-mono bg-white border border-slate-200 rounded px-2 py-1 max-h-24 overflow-auto whitespace-pre-wrap">
                                {outputPreview}
                              </div>
                            ) : null}
                            {inputPreview ? (
                              <div className="text-[11px] text-slate-500 font-mono border border-dashed border-slate-200 rounded px-2 py-1 max-h-16 overflow-auto whitespace-pre-wrap">
                                {inputPreview}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (selectedMessage.meta && 'toolTrace' in (selectedMessage.meta as any) ? (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-xs text-slate-500">Tool trace unavailable.</div>
                  </div>
                ) : null)}
                {Array.isArray((selectedMessage.meta as any)?.lastSearchResults) ? (
                  <div className="pt-2">
                    <div className="text-xs text-slate-500">
                      Last Search: {(selectedMessage.meta as any).lastSearchResults.length} item(s) cached
                    </div>
                  </div>
                ) : null}
                {selectedMessage.meta?.usage && (
                  <div className="pt-4 border-t border-slate-200">
                    <div className="text-xs font-medium text-slate-700 mb-2">Usage</div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Model:</span>
                        <span className="text-slate-900">{selectedMessage.meta.model ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Prompt tokens:</span>
                        <span className="text-slate-900 font-mono">{selectedMessage.meta.usage.prompt_tokens ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Completion tokens:</span>
                        <span className="text-slate-900 font-mono">{selectedMessage.meta.usage.completion_tokens ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total tokens:</span>
                        <span className="text-slate-900 font-mono">{selectedMessage.meta.usage.total_tokens ?? '—'}</span>
                      </div>
                    </div>
                  </div>
                )}
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
