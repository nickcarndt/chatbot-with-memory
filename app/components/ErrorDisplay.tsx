'use client';

interface ErrorDisplayProps {
  error: string;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <div className="flex justify-center">
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 max-w-[72ch] shadow-sm">
        <p className="text-sm text-red-800 whitespace-pre-wrap">{error}</p>
      </div>
    </div>
  );
}
