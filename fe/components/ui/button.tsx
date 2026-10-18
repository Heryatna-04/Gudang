import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'amber' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3.5 py-2 text-xs',
    lg: 'px-5 py-2.5 text-sm',
  };

  const variantStyles = {
    primary: 'bg-emerald-800 hover:bg-emerald-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white shadow-xs',
    secondary: 'bg-slate-100 hover:bg-slate-200 dark:bg-[#101c36] dark:hover:bg-[#152342] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-blue-900/40',
    amber: 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-xs',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
    ghost: 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
