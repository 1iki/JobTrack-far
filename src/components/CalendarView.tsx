import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, addMonths, subMonths, isAfter, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Trash2, Clock, Check } from 'lucide-react';
import { cn, STATUS_COLORS } from '../utils';
import { ReminderForm } from './ReminderForm';
import { Reminder } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export function CalendarView() {
  const { jobs, reminders, deleteReminder, updateReminder } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isReminderFormOpen, setIsReminderFormOpen] = useState(false);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Determine starting day of week for padding (0 = Sunday, 1 = Monday)
  // Shift so Monday is first
  const startDay = startOfMonth(currentDate).getDay();
  const paddingDays = Array.from({ length: startDay === 0 ? 6 : startDay - 1 });

  const selectedDayJobs = jobs.filter(j => isSameDay(new Date(j.dateApplied), selectedDate));
  const selectedDayReminders = reminders.filter(r => isSameDay(new Date(r.date), selectedDate));

  const upcomingReminders = useMemo(() => {
    const today = startOfDay(new Date());
    return [...reminders]
      .filter(r => isAfter(new Date(r.date), today) || isSameDay(new Date(r.date), today))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [reminders]);

  const handleDeleteReminder = (reminder: Reminder) => {
    if (window.confirm(`Hapus pengingat "${reminder.title}"?`)) {
      deleteReminder(reminder.id);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-6 max-w-lg mx-auto w-full">
      {/* Calendar Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 overflow-hidden p-6 sm:p-8"
      >
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={prevMonth} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95 cursor-pointer">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-display font-black text-slate-900 dark:text-white capitalize tracking-tight">
            {format(currentDate, 'MMMM yyyy', { locale: id })}
          </h2>
          <button onClick={nextMonth} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-full transition-all active:scale-95 cursor-pointer">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-4 text-center">
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Min</div>
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sen</div>
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sel</div>
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Rab</div>
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Kam</div>
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Jum</div>
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Sab</div>

          {paddingDays.map((_, i) => (
            <div key={`padding-${i}`} className="h-12 flex items-center justify-center" />
          ))}
          
          {daysInMonth.map(day => {
            const hasJobs = jobs.some(j => isSameDay(new Date(j.dateApplied), day));
            const hasReminders = reminders.some(r => isSameDay(new Date(r.date), day));
            const isSelected = isSameDay(day, selectedDate);
            
            return (
              <div key={day.toString()} className="h-12 flex flex-col items-center justify-center relative cursor-pointer" onClick={() => setSelectedDate(day)}>
                <span className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full text-sm transition-all duration-200 font-medium tabular-nums",
                  isSelected ? "bg-blue-600 dark:bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 scale-105" : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800"
                )}>
                  {format(day, 'd')}
                </span>
                
                {/* Dots indicator */}
                <div className="flex gap-1.5 absolute bottom-0 translate-y-1">
                  {hasJobs && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-xs" />}
                  {hasReminders && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-xs" />}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Selected Date Agenda */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-display font-black text-slate-900 dark:text-white">Jadwal & Pengingat</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mt-0.5 font-medium">{format(selectedDate, 'EEEE, dd MMMM yyyy', { locale: id })}</p>
          </div>
        </div>
        
        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsReminderFormOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 rounded-2xl text-sm font-bold hover:bg-blue-100/80 dark:hover:bg-blue-900/80 transition-colors shadow-xs cursor-pointer"
        >
          <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          Tambah Pengingat
        </motion.button>

        {selectedDayReminders.length === 0 && selectedDayJobs.length === 0 ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl text-sm text-center border border-slate-200/80 dark:border-slate-800 shadow-xs mt-2">
            <p className="text-slate-500 dark:text-slate-400 font-medium">Tidak ada agenda wawancara / tes pada tanggal ini.</p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {selectedDayReminders.map(r => (
              <div key={r.id} className={cn("bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-4 shadow-xs hover:shadow-md transition-all", r.completed && "opacity-60 grayscale")}>
                <div className="mt-0.5">
                  <button 
                    onClick={() => updateReminder(r.id, { completed: !r.completed })}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer",
                      r.completed ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600 text-transparent hover:border-blue-500"
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black bg-orange-100/80 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-md uppercase tracking-wider">{r.type}</span>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">{format(new Date(r.date), 'HH:mm')}</span>
                  </div>
                  <p className={cn("text-base font-bold text-slate-900 dark:text-white leading-tight", r.completed && "line-through")}>{r.title}</p>
                  {r.jobId && jobs.find(j => j.id === r.jobId) && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{jobs.find(j => j.id === r.jobId)?.title} - <span className="font-semibold">{jobs.find(j => j.id === r.jobId)?.company}</span></p>
                  )}
                </div>
                <button onClick={() => handleDeleteReminder(r)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer">
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
            {selectedDayJobs.map(j => (
              <div key={j.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider", STATUS_COLORS[j.status])}>LAMARAN: {j.status}</span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white leading-tight">{j.title}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">{j.company}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Reminders List */}
      <div className="flex flex-col gap-4 mt-4">
        <h3 className="text-lg font-display font-black text-slate-900 dark:text-white">Seluruh Pengingat Mendatang</h3>
        
        {upcomingReminders.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Tidak ada pengingat mendatang.</p>
        ) : (
          <div className="space-y-3">
            {upcomingReminders.map(r => (
              <div key={r.id} className={cn("bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-start gap-4 shadow-xs hover:shadow-md transition-all", r.completed && "opacity-60 grayscale")}>
                 <div className="mt-0.5">
                  <button 
                    onClick={() => updateReminder(r.id, { completed: !r.completed })}
                    className={cn(
                      "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors cursor-pointer",
                      r.completed ? "bg-blue-600 border-blue-600 text-white" : "border-slate-300 dark:border-slate-600 text-transparent hover:border-blue-500"
                    )}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md uppercase tracking-wider">{r.type}</span>
                    <span className="text-[11px] font-medium text-slate-500 tabular-nums">{format(new Date(r.date), 'dd MMM yyyy • HH:mm', { locale: id })}</span>
                  </div>
                  <p className={cn("text-base font-bold text-slate-900 leading-tight", r.completed && "line-through")}>{r.title}</p>
                  {r.jobId && jobs.find(j => j.id === r.jobId) && (
                    <p className="text-sm text-slate-500 mt-1">{jobs.find(j => j.id === r.jobId)?.title} - <span className="font-semibold">{jobs.find(j => j.id === r.jobId)?.company}</span></p>
                  )}
                </div>
                <button onClick={() => handleDeleteReminder(r)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isReminderFormOpen && (
          <ReminderForm onClose={() => setIsReminderFormOpen(false)} initialDate={selectedDate} />
        )}
      </AnimatePresence>
    </div>
  );
}

