'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownProps {
  children: string;
}

export function Markdown({ children }: MarkdownProps) {
  return (
    <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-code:before:content-[''] prose-code:after:content-[''] prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer noopener" />
          ),
          code: ({ node, className, children, ...props }) => {
            const isInline = !className || !className.startsWith('language-');
            if (isInline) {
              return (
                <code
                  {...props}
                  className="px-1.5 py-0.5 bg-slate-100 rounded text-sm font-mono text-slate-900"
                >
                  {children}
                </code>
              );
            }
            // Code block (wrapped in <pre> by react-markdown)
            return (
              <code
                {...props}
                className={`${className} block p-3 bg-slate-50 rounded-md text-sm font-mono text-slate-900 overflow-x-auto border border-slate-200`}
              >
                {children}
              </code>
            );
          },
          pre: ({ node, children, ...props }) => {
            return (
              <pre {...props} className="p-0 m-0 bg-transparent">
                {children}
              </pre>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
