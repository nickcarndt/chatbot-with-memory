'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AGENT_IDS, AGENT_NAMES, type AgentId } from '@/lib/agents';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageBubble } from './components/MessageBubble';
import { InspectorPanel } from './components/InspectorPanel';
import { Composer, type ComposerRef } from './components/Composer';
import { EmptyState } from './components/EmptyState';
import { LoadingIndicator } from './components/LoadingIndicator';
import { ErrorDisplay } from './components/ErrorDisplay';
import { CommandPalette } from './components/CommandPalette';

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
  durationMs?: number;
  agentId?: string;
  requestId?: string;
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentId>('general');
  const [error, setError] = useState<string | null>(null);
  const [evalMode, setEvalMode] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const composerRef = useRef<ComposerRef>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !currentConversation || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const startTime = Date.now();
    let requestId: string | undefined;

    try {
      const response = await fetch(`/api/conversations/${currentConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: 'user',
          content: messageContent,
        }),
      });

      requestId = response.headers.get('X-Request-ID') || undefined;

      if (!response.ok) {
        const error = await response.json();
        setMessages(prev => prev.slice(0, -1));
        setError(`Error: ${error.error?.message || 'Failed to send message'}\nRequest ID: ${error.error?.request_id || requestId || 'unknown'}`);
        return;
      }

      const durationMs = Date.now() - startTime;
      const assistantMessage: Message = {
        ...(await response.json()),
        durationMs,
        agentId: currentConversation.agentId,
        requestId,
      };
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <div className="hidden md:flex">
        <Sidebar
        selectedAgent={selectedAgent}
        onAgentChange={setSelectedAgent}
        onNewChat={createNewConversation}
        onClearAll={clearAllConversations}
        conversations={conversations}
        currentConversationId={currentConversation?.id || null}
        onSelectConversation={(id) => {
          const conv = conversations.find(c => c.id === id);
          if (conv) selectConversation(conv);
        }}
        onDeleteConversation={deleteConversation}
        formatDate={formatDate}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 md:min-w-0">
        {currentConversation ? (
          <>
            <ChatHeader
              title={currentConversation.title}
              agentId={currentConversation.agentId}
              evalMode={evalMode}
              onEvalModeToggle={() => setEvalMode(prev => !prev)}
            />

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-slate-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-slate-500">Start the conversation by sending a message</p>
                </div>
              ) : (
                messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    messageId={msg.id}
                    isSelected={selectedMessageId === msg.id}
                    onSelect={() => setSelectedMessageId(msg.id === selectedMessageId ? null : msg.id)}
                  />
                ))
              )}
              {isLoading && <LoadingIndicator />}
              {error && <ErrorDisplay error={error} />}
            </div>

            <Composer ref={composerRef} onSend={sendMessage} disabled={isLoading} />
          </>
        ) : (
          <EmptyState onStartChat={createNewConversation} />
        )}
      </div>

      {/* Inspector Drawer */}
      {currentConversation && (
        <InspectorPanel
          isOpen={evalMode}
          selectedMessage={
            selectedMessageId
              ? messages.find(m => m.id === selectedMessageId) || null
              : null
          }
          conversationAgentId={currentConversation.agentId}
          messageCount={messages.length}
          onClose={() => setEvalMode(false)}
        />
      )}

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNewChat={createNewConversation}
        onFocusComposer={() => composerRef.current?.focus()}
        onSwitchAgent={setSelectedAgent}
        onClearAll={clearAllConversations}
        currentAgent={selectedAgent}
      />
    </div>
  );
}
