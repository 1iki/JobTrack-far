import React, { useState, useEffect } from 'react';
import { useAppContext } from '../store';
import { JobApplication, JobStatus } from '../types';
import { PLATFORMS } from '../utils';
import { X, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface JobFormProps {
  jobToEdit?: JobApplication;
  onClose: () => void;
}

export function JobForm({ jobToEdit, onClose }: JobFormProps) {
  const { addJob, updateJob } = useAppContext();
  
  const [formData, setFormData] = useState<Partial<JobApplication>>({
    title: '',
    company: '',
    platform: PLATFORMS[0],
    location: '',
    expectedSalary: '',
    dateApplied: new Date().toISOString().split('T')[0],
    notes: '',
    status: JobStatus.TERKIRIM,
    url: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (jobToEdit) {
      setFormData(jobToEdit);
    }
  }, [jobToEdit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jobToEdit) {
      await updateJob(jobToEdit.id, formData as JobApplication);
    } else {
      await addJob(formData as Omit<JobApplication, 'id'>);
    }
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] z-10 border border-slate-100 dark:border-slate-800 overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <h2 className="text-base font-display font-black text-slate-900 dark:text-white">
                {jobToEdit ? 'Edit Lamaran' : 'Tambah Lamaran Baru'}
              </h2>
            </div>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 text-sm">
            <form id="job-form" onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Posisi Pekerjaan *</label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all" placeholder="e.g. Frontend Developer" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Perusahaan *</label>
                <input required type="text" name="company" value={formData.company} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all" placeholder="e.g. Tech Corp" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Status</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all">
                    {Object.values(JobStatus).map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Tanggal Melamar *</label>
                  <input required type="date" name="dateApplied" value={formData.dateApplied} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all tabular-nums" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Platform</label>
                  <select name="platform" value={formData.platform} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all">
                    {PLATFORMS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Lokasi</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all" placeholder="e.g. Jakarta Pusat / Remote" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Ekspektasi Gaji</label>
                <input type="text" name="expectedSalary" value={formData.expectedSalary} onChange={handleChange} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all tabular-nums" placeholder="e.g. Rp 10.000.000" />
              </div>

              <div className="space-y-3 p-4 bg-slate-50/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Lampiran Media</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">URL Lowongan</label>
                  <input type="url" name="url" value={formData.url} onChange={handleChange} className="w-full px-3.5 py-2 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">URL Gambar / Screenshot</label>
                  <input type="url" name="imageUrl" value={formData.imageUrl} onChange={handleChange} className="w-full px-3.5 py-2 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all" placeholder="https://.../image.png" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">Catatan Tambahan</label>
                <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="w-full px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-medium text-sm transition-all" placeholder="Informasi tes, PIC, dll..." />
              </div>

            </form>
          </div>

          <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
            <button type="submit" form="job-form" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-xs cursor-pointer">
              {jobToEdit ? 'Simpan Perubahan' : 'Simpan Lamaran'}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

