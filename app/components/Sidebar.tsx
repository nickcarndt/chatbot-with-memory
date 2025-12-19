'use client';

import { useState } from 'react';
import { AGENT_IDS, AGENT_NAMES, type AgentId } from '@/lib/agents';
import { Badge } from './Badge';

interface SidebarProps {
  selectedAgent: AgentId;
  onAgentChange: (agent: AgentId) => void;
  onNewChat: () => void;
  onClearAll: () => void;
  conversations: Array<{
    id: string;
    title: string;
    agentId: string;
    createdAt: string;
  }>;
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  formatDate: (date: string | undefined | null) => string;
}

export function Sidebar({
  selectedAgent,
  onAgentChange,
  onNewChat,
  onClearAll,
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  formatDate,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgent, setFilterAgent] = useState<AgentId | 'all'>('all');

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterAgent === 'all' || conv.agentId === filterAgent;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-64 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-800">
      {/* Brand Block */}
      <div className="p-6 pb-5 border-b border-slate-800">
        <h1 className="text-lg font-semibold text-slate-100 mb-1">Chatbot with Memory</h1>
        <p className="text-xs text-slate-500">Department Agents</p>
      </div>

      {/* Agent Selector */}
      <div className="px-4 py-3 border-b border-slate-800">
        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
          Agent
        </label>
        <div className="relative">
          <select
            value={selectedAgent}
            onChange={(e) => onAgentChange(e.target.value as AgentId)}
            className="w-full px-3 py-2 pr-8 bg-slate-900 border border-slate-800 rounded-md text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
          >
            {AGENT_IDS.map(agentId => (
              <option key={agentId} value={agentId} className="bg-slate-900">
                {AGENT_NAMES[agentId]}
              </option>
            ))}
          </select>
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 border-b border-slate-800 space-y-2">
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm transition-colors"
        >
          New Chat
        </button>
        <button
          onClick={onClearAll}
          className="w-full px-4 py-2 border border-red-600/30 text-red-400 rounded-md hover:bg-red-600/10 active:bg-red-600/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 font-medium text-sm transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-slate-800">
        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
          Search
        </label>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-md text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Agent Filter Chips */}
      <div className="px-4 py-3 border-b border-slate-800">
        <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">
          Filter
        </label>
        <div className="flex flex-wrap gap-1.5">
          {(['all', ...AGENT_IDS] as const).map(agentId => (
            <button
              key={agentId}
              onClick={() => setFilterAgent(agentId)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                filterAgent === agentId
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {agentId === 'all' ? 'All' : AGENT_NAMES[agentId]}
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-4 text-sm text-slate-500 text-center">
            {conversations.length === 0 ? 'No conversations yet' : 'No matches'}
          </div>
        ) : (
          <div className="p-2">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                className={`group relative p-2.5 mb-1 rounded-md cursor-pointer transition-colors ${
                  currentConversationId === conv.id
                    ? 'bg-slate-900/60 border-l-2 border-l-blue-500'
                    : 'hover:bg-slate-900/40 active:bg-slate-900/50'
                }`}
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <p className="text-sm font-medium leading-5 text-slate-100 truncate">
                      {conv.title}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <Badge agentId={conv.agentId} variant="default" />
                      <span className="text-xs text-slate-500 leading-none">
                        {formatDate(conv.createdAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    className="opacity-40 group-hover:opacity-100 focus:opacity-100 ml-2 p-1 text-slate-500 hover:text-red-400 active:text-red-500 transition-all rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    aria-label="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
