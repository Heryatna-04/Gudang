import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
  icon?: React.ReactNode;
}

export function Select({
  options = [],
  icon,
  className = '',
  children,
  ...props
}: SelectProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          {icon}
        </span>
      )}
      <select
        className={`w-full appearance-none rounded-xl py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 transition cursor-pointer ${
          icon ? 'pl-9 pr-9' : 'pl-3.5 pr-9'
        } bg-[#EDF2E8] text-slate-800 dark:bg-[#0f172a] dark:text-slate-100 border border-slate-200/60 dark:border-slate-800 ${className}`}
        {...props}
      >
        {children
          ? children
          : options.map((opt) => (
              <option key={String(opt.value)} value={opt.value}>
                {opt.label}
              </option>
            ))}
      </select>
      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}
