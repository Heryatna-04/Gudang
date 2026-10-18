import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'rose' | 'slate' | 'blue';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'slate', children, className = '', ...props }: BadgeProps) {
  const variantStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:bg-blue-500/15 dark:text-sky-300 border-emerald-500/20 dark:border-sky-500/30',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
