'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = totalItems !== undefined && itemsPerPage !== undefined
    ? (currentPage - 1) * itemsPerPage + 1
    : null;
  const endItem = totalItems !== undefined && itemsPerPage !== undefined
    ? Math.min(currentPage * itemsPerPage, totalItems)
    : null;

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs ${className}`}>
      <div className="text-slate-500 dark:text-zinc-400 font-medium">
        {totalItems !== undefined && startItem !== null && endItem !== null ? (
          <span>
            Menampilkan <strong className="text-slate-800 dark:text-zinc-200">{startItem} - {endItem}</strong> dari <strong className="text-slate-800 dark:text-zinc-200">{totalItems}</strong> data
          </span>
        ) : (
          <span>
            Halaman <strong className="text-slate-800 dark:text-zinc-200">{currentPage}</strong> dari <strong className="text-slate-800 dark:text-zinc-200">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2.5 py-1 text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
          <span>Sebelumnya</span>
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            // Show first, last, and pages around current
            if (
              p === 1 ||
              p === totalPages ||
              (p >= currentPage - 1 && p <= currentPage + 1)
            ) {
              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-800 dark:bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {p}
                </button>
              );
            }

            if (p === currentPage - 2 || p === currentPage + 2) {
              return (
                <span key={p} className="text-slate-400 px-1 select-none">
                  ...
                </span>
              );
            }

            return null;
          })}
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2.5 py-1 text-xs"
        >
          <span>Selanjutnya</span>
          <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
