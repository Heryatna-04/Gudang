import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  variant?: 'emerald' | 'amber' | 'blue' | 'slate' | 'rose';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'emerald',
  className = '',
}: StatCardProps) {
  const iconBgStyles = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:bg-blue-500/15 dark:text-sky-300 border-emerald-500/20 dark:border-sky-500/30',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  };

  return (
    <div
      className={`rounded-2xl border p-5 shadow-xs transition-all duration-200 border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-[#0b1220] flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </span>
          <div className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-slate-50 mt-1">
            {value}
          </div>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl border shrink-0 ${iconBgStyles[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
          {trend && (
            <span
              className={`font-black text-[11px] px-1.5 py-0.5 rounded-md ${
                trend.isPositive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.isPositive ? '+' : ''}
              {trend.value}
            </span>
          )}
          {subtitle && (
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
