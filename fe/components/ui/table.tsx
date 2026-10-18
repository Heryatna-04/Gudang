import React from 'react';

export function Table({
  className = '',
  children,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0b1220]">
      <table className={`w-full text-left text-xs ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={`bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/60 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={`hover:bg-emerald-50/40 dark:hover:bg-slate-800/40 transition-colors ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({
  className = '',
  children,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-3 font-black ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({
  className = '',
  children,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-3 text-slate-700 dark:text-slate-200 ${className}`} {...props}>
      {children}
    </td>
  );
}
