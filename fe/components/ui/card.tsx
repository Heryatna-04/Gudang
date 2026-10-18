import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  onSubmit?: (e: React.FormEvent<HTMLElement>) => void;
}

export function Card({ children, className = '', as, ...props }: CardProps) {
  const Component = (as || 'div') as React.ElementType;
  return (
    <Component
      className={`rounded-2xl border p-5 shadow-xs transition-colors duration-200 border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-[#0b1220] ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`flex items-center justify-between mb-3.5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 ${className}`} {...props}>
      {children}
    </h3>
  );
}
