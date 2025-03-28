import React from 'react';
import { cn } from '../lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      // Project statuses
      active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      archived: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      
      // Epic statuses
      planning: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'in-progress': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      blocked: 'bg-red-500/10 text-red-500 border-red-500/20',
      
      // Task statuses
      todo: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      'in-review': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      done: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    };

    return colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
        getStatusColor(status),
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </span>
  );
}