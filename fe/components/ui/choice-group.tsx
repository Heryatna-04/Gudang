'use client';

import React from 'react';

export interface ChoiceOption<T extends string | number> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface ChoiceGroupProps<T extends string | number> {
  options: ChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
  isDark?: boolean;
}

export function ChoiceGroup<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
  size = 'md',
  isDark = false,
}: ChoiceGroupProps<T>) {
  return (
    <div
      className={`inline-flex items-center p-1 rounded-2xl border transition-colors ${
        isDark
          ? 'bg-[#0f172a] border-slate-800'
          : 'bg-[#EDF2E8] border-emerald-950/5'
      } ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`relative flex items-center justify-center gap-2 rounded-xl font-extrabold transition-all cursor-pointer select-none ${
              size === 'sm' ? 'px-3 py-1.5 text-[11px]' : 'px-4 py-2 text-xs'
            } ${
              isSelected
                ? 'bg-emerald-800 text-white shadow-md shadow-emerald-950/20 scale-[1.02]'
                : isDark
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {option.icon && (
              <span className={`text-xs ${isSelected ? 'text-amber-400' : 'text-slate-400'}`}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {option.badge && (
              <span
                className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
