'use client';

import { Markdown } from './Markdown';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  messageId: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function MessageBubble({ role, content, messageId, isSelected, onSelect }: MessageBubbleProps) {
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
      <div
        onClick={onSelect}
        className={`max-w-[68ch] rounded-lg bg-white border shadow-sm cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-400 ring-2 ring-blue-200'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="px-4 py-3">
          <div className="text-sm text-slate-900">
            <Markdown>{content}</Markdown>
          </div>
        </div>
        <div className="px-4 pb-2 flex items-center justify-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.();
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-0.5"
            title="Inspect message"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
