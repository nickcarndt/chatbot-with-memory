'use client';


import { useState } from 'react';
import { Markdown } from './Markdown';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  messageId: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

function extractCheckoutUrl(content: string): string | null {
  // Extract URL from markdown link: [Open Stripe Checkout](url)
  const markdownLinkMatch = content.match(/\[Open Stripe Checkout\]\(([^)]+)\)/);
  if (markdownLinkMatch && markdownLinkMatch[1]) {
    return markdownLinkMatch[1];
  }
  // Fallback: look for any https:// URL in the content (only if markdown link not found)
  const urlMatch = content.match(/https?:\/\/[^\s\)\n]+/);
  return urlMatch ? urlMatch[0] : null;
}

function StripeCheckoutMessage({ content }: { content: string }) {
  const checkoutUrl = extractCheckoutUrl(content);
  const [copied, setCopied] = useState(false);
  
  if (!checkoutUrl) {
    // Fallback to normal markdown rendering if URL extraction fails
    return <Markdown>{content}</Markdown>;
  }

  const handleCopyCardNumber = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText('4242424242424242');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = '4242424242424242';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-slate-900">
        ✅ Stripe checkout created (test mode)
      </div>
      
      <div>
        <a
          href={checkoutUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm text-blue-600 no-underline hover:underline transition-colors inline-flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          Open Stripe Checkout ↗
        </a>
      </div>
      
      <div className="space-y-2 text-sm text-slate-700">
        <div className="font-medium">Test mode note: You can use the following test card details for payment:</div>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li className="flex items-center gap-2">
            <span>Card number: 4242424242424242</span>
            <button
              onClick={handleCopyCardNumber}
              className="text-xs px-2 py-0.5 rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              title="Copy card number"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </li>
          <li>Expiry date: Any future date</li>
          <li>CVC: Any 3 digits</li>
        </ul>
      </div>
    </div>
  );
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

  const isStripeCheckout = role === 'assistant' && content.startsWith('✅ Stripe checkout created (test mode)');

  return (
    <div className="flex justify-start">
      <div
        onClick={onSelect}
        className={`max-w-[68ch] rounded-lg bg-white border shadow-sm cursor-pointer transition-all ${
          isSelected
            ? 'border-blue-400 ring-2 ring-blue-200'
            : 'border-slate-200 hover:border-slate-300'
        } px-4 ${isStripeCheckout ? 'py-2.5' : 'py-3'}`}
      >
        <div className={isStripeCheckout ? '' : 'text-sm text-slate-900'}>
          {isStripeCheckout ? (
            <StripeCheckoutMessage content={content} />
          ) : (
            <Markdown>{content}</Markdown>
          )}
        </div>
        <div className="px-4 pb-2 flex items-center justify-end mt-2">
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
