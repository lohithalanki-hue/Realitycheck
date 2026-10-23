import React from 'react';
import { CategoryType, PriorityType, TaskStatus } from '../../types';

export const CategoryBadge: React.FC<{ category: CategoryType; size?: 'sm' | 'md' }> = ({
  category,
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const styles: Record<CategoryType, { dot: string; border: string; bg: string; text: string }> = {
    'Deep Work': {
      dot: 'bg-[#C6F66A] shadow-[0_0_6px_#C6F66A]',
      border: 'border-[#C6F66A]/25',
      bg: 'bg-[#C6F66A]/10',
      text: 'text-[#C6F66A]',
    },
    'Meetings & Syncs': {
      dot: 'bg-purple-400 shadow-[0_0_6px_#c084fc]',
      border: 'border-purple-500/25',
      bg: 'bg-purple-500/10',
      text: 'text-purple-300',
    },
    'Creative & Design': {
      dot: 'bg-[#86E3CE] shadow-[0_0_6px_#86E3CE]',
      border: 'border-[#86E3CE]/25',
      bg: 'bg-[#86E3CE]/10',
      text: 'text-[#86E3CE]',
    },
    'Learning & Research': {
      dot: 'bg-amber-400 shadow-[0_0_6px_#fbbf24]',
      border: 'border-amber-500/25',
      bg: 'bg-amber-500/10',
      text: 'text-amber-300',
    },
    'Admin & Operations': {
      dot: 'bg-sky-400 shadow-[0_0_6px_#38bdf8]',
      border: 'border-sky-500/25',
      bg: 'bg-sky-500/10',
      text: 'text-sky-300',
    },
    'Health & Personal': {
      dot: 'bg-rose-400 shadow-[0_0_6px_#fb7185]',
      border: 'border-rose-500/25',
      bg: 'bg-rose-500/10',
      text: 'text-rose-300',
    },
  };

  const item = styles[category] || styles['Deep Work'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${item.border} ${item.bg} ${item.text} backdrop-blur-md font-medium ${sizeClasses}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
      <span>{category}</span>
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: PriorityType }> = ({ priority }) => {
  const styles: Record<PriorityType, { label: string; color: string; border: string }> = {
    critical: { label: 'Critical', color: 'text-rose-300 bg-rose-500/15', border: 'border-rose-500/35' },
    high: { label: 'High', color: 'text-amber-300 bg-amber-500/15', border: 'border-amber-500/30' },
    medium: { label: 'Medium', color: 'text-blue-300 bg-blue-500/15', border: 'border-blue-500/25' },
    low: { label: 'Low', color: 'text-zinc-400 bg-white/5', border: 'border-white/10' },
  };

  const item = styles[priority];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider font-bold border backdrop-blur-md ${item.color} ${item.border}`}
    >
      {item.label}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C6F66A]/15 text-[#C6F66A] border border-[#C6F66A]/30 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C6F66A] shadow-[0_0_6px_#C6F66A]" />
          Completed
        </span>
      );
    case 'in_progress':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#86E3CE]/15 text-[#86E3CE] border border-[#86E3CE]/30 backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-[#86E3CE] animate-pulse" />
          In Progress
        </span>
      );
    case 'partially_completed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/25 backdrop-blur-md">
          Partial
        </span>
      );
    case 'postponed':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/15 text-purple-300 border border-purple-500/25 backdrop-blur-md">
          Postponed
        </span>
      );
    case 'cancelled':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-zinc-500 border border-white/10 backdrop-blur-md">
          Cancelled
        </span>
      );
    case 'planned':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white/5 text-zinc-300 border border-white/15 backdrop-blur-md">
          Planned
        </span>
      );
  }
};
