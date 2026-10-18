import React from 'react';
import { CategoryType, PriorityType, TaskStatus } from '../../types';

export const CategoryBadge: React.FC<{ category: CategoryType; size?: 'sm' | 'md' }> = ({
  category,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/[0.06] backdrop-blur-md text-white font-medium ${sizeClasses}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_#fff]" />
      <span>{category}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityType }> = ({ priority }) => {
  const styles: Record<PriorityType, { label: string; color: string; border: string }> = {
    critical: { label: 'Critical', color: 'text-white bg-white/20', border: 'border-white/40' },
    high: { label: 'High', color: 'text-zinc-200 bg-white/10', border: 'border-white/25' },
    medium: { label: 'Medium', color: 'text-zinc-300 bg-white/5', border: 'border-white/15' },
    low: { label: 'Low', color: 'text-zinc-400 bg-black', border: 'border-white/10' },
  };

  const item = styles[priority];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-semibold border ${item.color} ${item.border}`}
    >
      {item.label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white text-black border border-white shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-black" />
          Completed
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white border border-white/30">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          In Progress
        </span>
      );
    case 'partially_completed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-zinc-300 border border-white/20">
          Partial
        </span>
      );
    case 'postponed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-zinc-400 border border-white/15">
          Postponed
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-black text-zinc-500 border border-zinc-800">
          Cancelled
        </span>
      );
    case 'planned':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-900/80 text-zinc-400 border border-white/10">
          Planned
        </span>
      );
  }
};
