'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InteractiveCalendarProps {
  isDark?: boolean;
  /** Tanggal terpilih dari luar (controlled). Jika kosong, kalender menyimpan sendiri. */
  value?: Date;
  onSelectDate?: (date: Date) => void;
}

export function InteractiveCalendar({ isDark = false, value, onSelectDate }: InteractiveCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [internalSelected, setInternalSelected] = useState<Date>(() => new Date());
  const selectedDate = value ?? internalSelected;
  const setSelectedDate = setInternalSelected;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const prevLastDay = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (dayNumber: number) => {
    const chosen = new Date(year, month, dayNumber);
    setSelectedDate(chosen);
    if (onSelectDate) onSelectDate(chosen);
  };

  // Generate filler & day array
  const prevFiller = [];
  for (let x = firstDayIndex; x > 0; x--) {
    prevFiller.push(prevLastDay - x + 1);
  }

  const currentDays = [];
  for (let d = 1; d <= lastDay; d++) {
    currentDays.push(d);
  }

  return (
    <div className={`p-5 rounded-2xl border transition-colors ${
      isDark ? 'bg-[#0b1220] border-slate-800/80' : 'bg-white border-slate-200/80 shadow-xs'
    }`}>
      {/* Month Navigator */}
      <div className="flex items-center justify-between mb-3.5">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className={`font-black text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week Header */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-2">
        <span>M</span><span>S</span><span>S</span><span>R</span><span>K</span><span>J</span><span>S</span>
      </div>

      {/* Grid Days */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
        {prevFiller.map((pDay) => (
          <span key={`prev-${pDay}`} className="p-1.5 text-slate-400/40 select-none">
            {pDay}
          </span>
        ))}

        {currentDays.map((cDay) => {
          const isSelected =
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth() === month &&
            selectedDate.getDate() === cDay;

          return (
            <button
              key={`curr-${cDay}`}
              type="button"
              onClick={() => handleDayClick(cDay)}
              className={`p-1.5 rounded-full transition cursor-pointer text-xs font-bold ${
                isSelected
                  ? isDark
                    ? 'bg-blue-600 text-white font-black shadow-xs ring-2 ring-blue-500/30'
                    : 'bg-emerald-800 text-white font-black shadow-xs ring-2 ring-emerald-500/30'
                  : isDark
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cDay}
            </button>
          );
        })}
      </div>

      {/* Date Feedback Bar */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-slate-400">Pilihan:</span>
        <span className="font-extrabold text-emerald-800 dark:text-sky-300">
          {selectedDate.getDate()} {monthNames[selectedDate.getMonth()].slice(0, 3)} {selectedDate.getFullYear()}
        </span>
      </div>
    </div>
  );
}
