'use client';

import { AGENT_NAMES, type AgentId } from '@/lib/agents';

interface BadgeProps {
  agentId: string;
  variant?: 'default' | 'selected' | 'light';
}

export function Badge({ agentId, variant = 'default' }: BadgeProps) {
  const agentName = AGENT_NAMES[agentId as AgentId] || agentId;

  const baseClasses = 'inline-flex items-center whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium leading-none min-h-[20px]';
  
  const variantClasses = {
    default: 'bg-slate-800 text-slate-300',
    selected: 'bg-blue-600 text-white',
    light: 'bg-slate-100 text-slate-700',
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {agentName}
    </span>
  );
}
