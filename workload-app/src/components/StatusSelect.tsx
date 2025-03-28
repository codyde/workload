import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

interface StatusSelectProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  className?: string;
}

export function StatusSelect({ value, options, onChange, className }: StatusSelectProps) {
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
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'appearance-none rounded-full px-3 py-1 text-xs font-medium border pr-8',
          getStatusColor(value),
          className
        )}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"
      />
    </div>
  );
}