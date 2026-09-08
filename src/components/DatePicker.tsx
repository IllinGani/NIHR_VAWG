import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Clock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  minDate?: Date;
  disabled?: boolean;
  align?: 'left' | 'right';
}

const DAYS_OF_WEEK = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Safely parse date from various formats (DD/MM/YYYY, YYYY-MM-DD, ISO)
 */
export function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  try {
    if (trimmed.includes('/')) {
      const parts = trimmed.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          // DD/MM/YYYY
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) return d;
        } else if (parts[0].length === 4) {
          // YYYY/MM/DD
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) return d;
        }
      }
    } else if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) return d;
        } else if (parts[2].length === 4) {
          // DD-MM-YYYY
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          const d = new Date(year, month, day);
          if (!isNaN(d.getTime())) return d;
        }
      }
    }

    const fallback = new Date(trimmed);
    if (!isNaN(fallback.getTime())) return fallback;
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Format Date object to DD/MM/YYYY
 */
export function formatToStandardDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date (DD/MM/YYYY)',
  label,
  className,
  disabled = false,
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = parseFlexibleDate(value);

  // Current view month & year in popout calendar
  const today = new Date();
  const [viewMonth, setViewMonth] = useState<number>(() => {
    return selectedDate ? selectedDate.getMonth() : today.getMonth();
  });
  const [viewYear, setViewYear] = useState<number>(() => {
    return selectedDate ? selectedDate.getFullYear() : today.getFullYear();
  });

  // When selectedDate changes externally, sync view if calendar opened
  useEffect(() => {
    if (selectedDate) {
      setViewMonth(selectedDate.getMonth());
      setViewYear(selectedDate.getFullYear());
    }
  }, [value]);

  // Handle click outside & escape key to dismiss
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Navigate month
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Generate days matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const calendarDays: {
    dayNumber: number;
    monthOffset: number; // -1: prev, 0: current, 1: next
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
  }[] = [];

  // Prev month padding
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const date = new Date(viewYear, viewMonth - 1, dayNumber);
    calendarDays.push({
      dayNumber,
      monthOffset: -1,
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(viewYear, viewMonth, i);
    calendarDays.push({
      dayNumber: i,
      monthOffset: 0,
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
    });
  }

  // Next month padding to fill grid (usually 35 or 42 slots)
  const remainingSlots = (7 - (calendarDays.length % 7)) % 7;
  for (let i = 1; i <= remainingSlots; i++) {
    const date = new Date(viewYear, viewMonth + 1, i);
    calendarDays.push({
      dayNumber: i,
      monthOffset: 1,
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
    });
  }

  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }

  const handleSelectDate = (date: Date) => {
    onChange(formatToStandardDate(date));
    setIsOpen(false);
  };

  const handleQuickPreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    handleSelectDate(target);
  };

  const handleEndOfMonth = () => {
    const end = new Date(viewYear, viewMonth + 1, 0);
    handleSelectDate(end);
  };

  // Year choices for quick dropdown (2024 to 2032)
  const yearRange = Array.from({ length: 9 }, (_, i) => 2024 + i);

  // Calculate relative indicator (e.g. "In 12 days", "Overdue by 3 days")
  const getRelativeInfo = () => {
    if (!selectedDate) return null;
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    const s = new Date(selectedDate);
    s.setHours(0, 0, 0, 0);
    const diffTime = s.getTime() - t.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'Today', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (diffDays === 1) return { label: 'Tomorrow', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (diffDays < 0) return { label: `Overdue (${Math.abs(diffDays)}d ago)`, color: 'text-rose-600 bg-rose-50 border-rose-200' };
    if (diffDays <= 14) return { label: `In ${diffDays} days`, color: 'text-orange-600 bg-orange-50 border-orange-200' };
    return { label: `In ${diffDays} days`, color: 'text-slate-600 bg-slate-100 border-slate-200' };
  };

  const relativeInfo = getRelativeInfo();

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          {label}
        </label>
      )}

      {/* Input box with popout calendar trigger button */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(true)}
          className={cn(
            "w-full pl-3.5 pr-24 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all",
            isOpen ? "border-brand-orange ring-2 ring-brand-orange/20 bg-white" : "hover:border-slate-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 focus:bg-white",
            disabled && "opacity-60 cursor-not-allowed bg-slate-100"
          )}
        />

        <div className="absolute right-1.5 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
              title="Clear date"
            >
              <X size={13} />
            </button>
          )}

          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs border",
              isOpen 
                ? "bg-brand-orange text-white border-brand-orange" 
                : "bg-white text-slate-600 border-slate-200 hover:border-brand-orange hover:text-brand-orange"
            )}
            title="Pop out calendar"
          >
            <Calendar size={13} />
            <span className="text-[10px] hidden sm:inline">Pick</span>
          </button>
        </div>
      </div>

      {/* Relative deadline chip under input if set */}
      {relativeInfo && !isOpen && (
        <div className="mt-1 flex items-center gap-1.5">
          <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold border", relativeInfo.color)}>
            {relativeInfo.label}
          </span>
        </div>
      )}

      {/* Pop-out Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "absolute top-full mt-1.5 z-50 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 select-none",
              align === 'right' ? "right-0" : "left-0"
            )}
            style={{ filter: 'drop-shadow(0 20px 25px -5px rgb(0 0 0 / 0.15))' }}
          >
            {/* Header: Month & Year Selector + Controls */}
            <div className="flex items-center justify-between gap-1 mb-3 pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                  className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 cursor-pointer outline-none focus:ring-1 focus:ring-brand-orange"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx}>{name}</option>
                  ))}
                </select>

                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                  className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 cursor-pointer outline-none focus:ring-1 focus:ring-brand-orange"
                >
                  {yearRange.map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Previous month"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Next month"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className="text-[10px] font-black text-slate-400 uppercase py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center mb-3">
              {calendarDays.map((item, idx) => {
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDate(item.date)}
                    className={cn(
                      "h-8 text-xs font-semibold rounded-xl flex items-center justify-center transition-all cursor-pointer relative",
                      item.isSelected
                        ? "bg-brand-orange text-white font-bold shadow-sm"
                        : item.isCurrentMonth
                        ? item.isToday
                          ? "bg-orange-50 text-brand-orange font-bold border border-brand-orange/40 hover:bg-orange-100"
                          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                        : "text-slate-300 hover:bg-slate-50 hover:text-slate-400"
                    )}
                  >
                    {item.dayNumber}
                    {item.isToday && !item.isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-orange" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Presets & Controls */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] gap-1 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset(0)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-[10px]"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset(7)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-[10px]"
                  >
                    +1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset(14)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-[10px]"
                  >
                    +2 Weeks
                  </button>
                  <button
                    type="button"
                    onClick={handleEndOfMonth}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer text-[10px]"
                  >
                    End of Mo
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                {value ? (
                  <button
                    type="button"
                    onClick={() => {
                      onChange('');
                      setIsOpen(false);
                    }}
                    className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer"
                  >
                    Remove Deadline
                  </button>
                ) : <span />}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer ml-auto"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
