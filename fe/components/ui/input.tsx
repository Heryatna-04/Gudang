import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function Input({ icon, className = '', ...props }: InputProps) {
  return (
    <div className="relative w-full">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
      )}
      <input
        className={`w-full rounded-xl py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 transition ${
          icon ? 'pl-9 pr-3.5' : 'px-3.5'
        } bg-[#EDF2E8] text-slate-800 placeholder-slate-400 dark:bg-[#0f172a] dark:text-slate-100 dark:placeholder-slate-500 border border-transparent dark:border-slate-800 ${className}`}
        {...props}
      />
    </div>
  );
}
