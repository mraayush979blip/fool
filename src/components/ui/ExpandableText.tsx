'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export default function ExpandableText({ text, maxLength = 150, className }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= maxLength) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div className="space-y-3">
      <p className={className}>
        {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      </p>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-blue-400 hover:text-white transition-colors bg-blue-900/20 px-3 py-1.5 rounded-full border border-blue-500/20 shadow-sm"
      >
        {isExpanded ? (
          <>Read Less <ChevronUp className="w-3 h-3" /></>
        ) : (
          <>Read More <ChevronDown className="w-3 h-3" /></>
        )}
      </button>
    </div>
  );
}
