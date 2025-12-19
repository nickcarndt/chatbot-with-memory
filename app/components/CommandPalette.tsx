'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { AGENT_IDS, AGENT_NAMES, type AgentId } from '@/lib/agents';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onFocusComposer: () => void;
  onSwitchAgent: (agent: AgentId) => void;
  onClearAll: () => void;
  currentAgent: AgentId;
}

type Command = 
  | { type: 'new-chat'; label: string }
  | { type: 'focus-composer'; label: string }
  | { type: 'switch-agent'; label: string; agent: AgentId }
  | { type: 'clear-all'; label: string };

export function CommandPalette({
  isOpen,
  onClose,
  onNewChat,
  onFocusComposer,
  onSwitchAgent,
  onClearAll,
  currentAgent,
}: CommandPaletteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showAgents, setShowAgents] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseCommands: Command[] = [
    { type: 'new-chat', label: 'New Chat' },
    { type: 'focus-composer', label: 'Focus Composer' },
    { type: 'switch-agent', label: 'Switch Agent', agent: 'general' },
    { type: 'clear-all', label: 'Clear All Conversations' },
  ];

  const agentCommands: Command[] = AGENT_IDS.map(agentId => ({
    type: 'switch-agent' as const,
    label: AGENT_NAMES[agentId],
    agent: agentId,
  }));

  const commands = showAgents ? agentCommands : baseCommands;

  const handleCommand = useCallback((command: Command) => {
    if (command.type === 'new-chat') {
      onNewChat();
      onClose();
    } else if (command.type === 'focus-composer') {
      onFocusComposer();
      onClose();
    } else if (command.type === 'switch-agent') {
      if (showAgents) {
        onSwitchAgent(command.agent);
        onClose();
      } else {
        setShowAgents(true);
        setSelectedIndex(0);
      }
    } else if (command.type === 'clear-all') {
      if (confirm('Are you sure you want to clear all conversations?')) {
        onClearAll();
        onClose();
      }
    }
  }, [onNewChat, onFocusComposer, onSwitchAgent, onClearAll, onClose, showAgents]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSelectedIndex(0);
      setShowAgents(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % commands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleCommand(commands[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, commands, onClose, handleCommand]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/20 flex items-start justify-center pt-[20vh] z-50"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-lg shadow-sm w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2 border-b border-slate-200">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            className="w-full px-3 py-2 text-sm border-0 focus:outline-none focus:ring-0"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {commands.map((command, index) => (
            <button
              key={index}
              onClick={() => handleCommand(command)}
              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-slate-900 hover:bg-slate-50'
              }`}
            >
              {command.label}
              {command.type === 'switch-agent' && !showAgents && (
                <span className="ml-2 text-xs text-slate-500">→</span>
              )}
            </button>
          ))}
        </div>
        <div className="px-3 py-2 border-t border-slate-200 text-xs text-slate-500">
          ↑↓ to navigate • Enter to select • Esc to close
        </div>
      </div>
    </div>
  );
}
