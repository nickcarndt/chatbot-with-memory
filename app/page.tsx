'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AGENT_IDS, AGENT_NAMES, type AgentId } from '@/lib/agents';

interface Conversation {
  id: string;
  title: string;
  agentId: string;
  createdAt: string;
  messages: Message[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('general');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (currentConversation) {
      setMessages(currentConversation.messages || []);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) {
        const error = await response.json();
        console.error('Error loading conversations:', error);
        setError(`Failed to load conversations. Request ID: ${error.error?.request_id || 'unknown'}`);
        return;
      }
      const data = await response.json();
      setConversations(data);
      setError(null);
    } catch (error) {
      console.error('Error loading conversations:', error);
      setError('Network error loading conversations');
    }
  };

  const createNewConversation = async () => {
    try {
      setError(null);
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent_id: selectedAgent }), // API expects snake_case
      });
      if (!response.ok) {
        const error = await response.json();
        setError(`Error: ${error.error?.message || 'Failed to create conversation'}\nRequest ID: ${error.error?.request_id || 'unknown'}`);
        return;
      }
      const newConv = await response.json();
      setConversations(prev => [newConv, ...prev]);
      setCurrentConversation({ ...newConv, messages: [] });
      setMessages([]);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Network error. Please try again.');
    }
  };

  const selectConversation = async (conv: Conversation) => {
    try {
      setError(null);
      const response = await fetch(`/api/conversations/${conv.id}`);
      if (!response.ok) {
        const error = await response.json();
        console.error('Error loading conversation:', error);
        setError(`Failed to load conversation. Request ID: ${error.error?.request_id || 'unknown'}`);
        return;
      }
      const data = await response.json();
      setCurrentConversation(data);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setError('Network error loading conversation');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !currentConversation || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: inputMessage,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setMessages(prev => prev.slice(0, -1));
        setError(`Error: ${error.error?.message || 'Failed to send message'}\nRequest ID: ${error.error?.request_id || 'unknown'}`);
        return;
      }

      const assistantMessage = await response.json();
      setMessages(prev => [...prev, assistantMessage]);

      // Refresh conversation to get updated title
      const convResponse = await fetch(`/api/conversations/${currentConversation.id}`);
      if (convResponse.ok) {
        const updatedConv = await convResponse.json();
        setCurrentConversation(updatedConv);
        setConversations(prev =>
          prev.map(c => (c.id === currentConversation.id ? updatedConv : c))
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.slice(0, -1));
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        console.error('Error deleting conversation:', error);
        return;
      }
      setConversations(prev => prev.filter(c => c.id !== id));
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const clearAllConversations = async () => {
    if (!confirm('Are you sure you want to clear all conversations?')) return;
    try {
      const response = await fetch('/api/conversations', { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        setError(`Error: ${error.error?.message || 'Failed to clear conversations'}\nRequest ID: ${error.error?.request_id || 'unknown'}`);
        return;
      }
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
    } catch (error) {
      console.error('Error clearing conversations:', error);
      setError('Network error. Please try again.');
    }
  };

  const getAgentBadgeColor = (agentId: string) => {
    const colors: Record<string, string> = {
      general: 'bg-gray-100 text-gray-700',
      sales: 'bg-blue-100 text-blue-700',
      support: 'bg-green-100 text-green-700',
      engineering: 'bg-purple-100 text-purple-700',
      exec: 'bg-amber-100 text-amber-700',
    };
    return colors[agentId] || colors.general;
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '—';
      return date.toLocaleDateString();
    } catch {
      return '—';
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar - Dark theme */}
      <div className="w-64 bg-slate-900 flex flex-col shadow-lg">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold mb-4 text-slate-100">Chatbot with Memory</h1>
          
          {/* Agent Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Department Agent
            </label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value as AgentId)}
              className="w-full px-3 py-2 border border-slate-700 rounded-md bg-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {AGENT_IDS.map(agentId => (
                <option key={agentId} value={agentId} className="bg-slate-800">
                  {AGENT_NAMES[agentId]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <button
              onClick={createNewConversation}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              + New Chat
            </button>
            <button
              onClick={clearAllConversations}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-medium text-sm"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-slate-400 text-center">
              No conversations yet
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`p-3 border-b border-slate-700 cursor-pointer hover:bg-slate-800 transition-colors ${
                  currentConversation?.id === conv.id ? 'bg-slate-800 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => selectConversation(conv)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-100 truncate">{conv.title}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAgentBadgeColor(conv.agentId)}`}>
                        {AGENT_NAMES[conv.agentId as AgentId] || 'General'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatDate(conv.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    className="ml-2 text-slate-500 hover:text-red-400 transition-colors text-lg leading-none"
                    title="Delete conversation"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">{currentConversation.title}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getAgentBadgeColor(currentConversation.agentId)}`}>
                    {AGENT_NAMES[currentConversation.agentId as AgentId] || 'General Assistant'}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500">Start the conversation by sending a message</p>
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-2xl rounded-lg px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-900 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-600 text-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="ml-2">Assistant is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-2xl">
                    <p className="text-sm text-red-800 whitespace-pre-wrap">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-200 bg-white shadow-sm">
              <div className="flex space-x-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
                  disabled={isLoading}
                  className="flex-1 p-3 border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 bg-white disabled:bg-slate-50 disabled:text-slate-500 text-sm"
                  rows={1}
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold mb-4 text-slate-900">Welcome to Chatbot with Memory</h2>
              <p className="text-slate-600 mb-6">Select a department agent and start a new conversation</p>
              <button
                onClick={createNewConversation}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
