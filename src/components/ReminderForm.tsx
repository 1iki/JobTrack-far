import React, { useState } from 'react';
import { useAppContext } from '../store';
import { Reminder } from '../types';
import { X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReminderFormProps {
  onClose: () => void;
  initialDate?: Date;
}

export function ReminderForm({ onClose, initialDate }: ReminderFormProps) {
  const { addReminder, jobs } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Reminder>>({
    title: '',
    type: 'WAWANCARA',
    date: initialDate ? new Date(initialDate.getTime() - initialDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    jobId: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !formData.title || !formData.date || !formData.type) return;

    setIsSubmitting(true);
    try {
      await addReminder({
        title: formData.title,
        type: formData.type as 'TES' | 'WAWANCARA' | 'DEADLINE',
        date: new Date(formData.date).toISOString(),
        jobId: formData.jobId || ''
      });

      onClose();
    } catch (err) {
      console.error('Reminder form submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isMobileOrTablet = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" 
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, y: isMobileOrTablet ? '100%' : 15, scale: isMobileOrTablet ? 1 : 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: isMobileOrTablet ? '100%' : 15, scale: isMobileOrTablet ? 1 : 0.96 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] z-10 border border-slate-100 dark:border-slate-800 overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-base font-display font-black text-slate-900 dark:text-white">
                Tambah Pengingat Baru
              </h2>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 text-sm">
            <form id="reminder-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Judul Pengingat *</label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all" placeholder="e.g. Technical Test Shopee" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Tipe *</label>
                <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all">
                  <option value="WAWANCARA">Wawancara</option>
                  <option value="TES">Tes / Assessment</option>
                  <option value="DEADLINE">Deadline</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Tanggal & Waktu *</label>
                <input required type="datetime-local" name="date" value={formData.date} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all tabular-nums" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Terkait Lamaran (Opsional)</label>
                <select name="jobId" value={formData.jobId} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all">
                  <option value="">- Tidak ada -</option>
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>{job.title} - {job.company}</option>
                  ))}
                </select>
              </div>
            </form>
          </div>

          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <button 
              type="submit" 
              form="reminder-form" 
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pengingat (Set Alarm)'}
            </button>
          </div>
        </motion.div>
      </div>
  );
}
