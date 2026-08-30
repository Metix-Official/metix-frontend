'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalendarProps {
  mode?: 'single';
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  defaultMonth?: Date;
  className?: string;
}

export const Calendar: React.FC<CalendarProps> = ({
  selected,
  onSelect,
  defaultMonth,
  className,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    defaultMonth || selected || new Date()
  );

  React.useEffect(() => {
    if (selected) {
      setCurrentMonth(selected);
    }
  }, [selected]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleDateClick = (dayNum: number) => {
    const newDate = new Date(year, month, dayNum);
    if (onSelect) {
      onSelect(newDate);
    }
  };

  const isSelected = (dayNum: number) => {
    if (!selected) return false;
    return (
      selected.getDate() === dayNum &&
      selected.getMonth() === month &&
      selected.getFullYear() === year
    );
  };

  const isToday = (dayNum: number) => {
    const today = new Date();
    return (
      today.getDate() === dayNum &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  return (
    <div className={cn('p-3 space-y-4 w-64 select-none', className)}>
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-extrabold text-xs text-slate-900">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400">
        {dayNames.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 text-center gap-1 text-xs">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const active = isSelected(dayNum);
          const today = isToday(dayNum);

          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => handleDateClick(dayNum)}
              className={cn(
                'h-8 w-8 rounded-xl font-bold transition-all flex items-center justify-center mx-auto cursor-pointer text-xs',
                active
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : today
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
};
