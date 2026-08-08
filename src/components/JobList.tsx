import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import { JobStatus, JobApplication } from '../types';
import { STATUS_COLORS, cn } from '../utils';
import { Search, MapPin, Building2, ExternalLink, Calendar as CalendarIcon, Image as ImageIcon, Download, Trash2 } from 'lucide-react';
import { MediaViewer } from './MediaViewer';
import { motion, AnimatePresence } from 'motion/react';

export function JobList({ onEdit, onExport }: { onEdit: (job: JobApplication) => void, onExport: () => void }) {
  const { jobs, deleteJob } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'ALL'>('ALL');
  const [mediaViewer, setMediaViewer] = useState<{ url?: string; imageUrl?: string } | null>(null);
  const [jobToDelete, setJobToDelete] = useState<JobApplication | null>(null);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    jobs.forEach(j => {
      counts[j.status] = (counts[j.status] || 0) + 1;
    });
    return counts;
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        const matchesSearch = 
          job.title.toLowerCase().includes(search.toLowerCase()) || 
          job.company.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || job.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime());
  }, [jobs, search, filterStatus]);

  const handleResetFilter = () => {
    setSearch('');
    setFilterStatus('ALL');
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between bg-white/80 backdrop-blur-md p-3.5 rounded-2xl shadow-sm border border-slate-200/80">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2.5 border border-slate-200/80 dark:border-slate-800 rounded-xl leading-5 bg-slate-50/80 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 text-sm font-medium transition-all"
            placeholder="Cari posisi atau perusahaan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onExport}
          className="px-5 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-300 dark:text-white" />
          Ekspor CSV
        </motion.button>
      </div>

      {/* Filter Chips */}
      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 hide-scrollbar">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={cn(
            "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 cursor-pointer",
            filterStatus === 'ALL' ? "bg-blue-600 dark:bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300"
          )}
        >
          Semua <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] tabular-nums", filterStatus === 'ALL' ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>{jobs.length}</span>
        </button>
        {Object.values(JobStatus).map((status) => {
          const count = statusCounts[status] || 0;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 cursor-pointer",
                filterStatus === status ? "bg-blue-600 dark:bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20" : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300"
              )}
            >
              {status} <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] tabular-nums", filterStatus === status ? "bg-blue-700 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400")}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Job List */}
      {filteredJobs.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mt-4 p-6"
        >
          <div className="w-16 h-16 bg-slate-100/80 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200/50 dark:border-slate-700/50">
            <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-lg font-display font-black text-slate-900 dark:text-white mb-1">Tidak ada lowongan ditemukan</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">Coba ubah kata kunci pencarian atau reset filter Anda.</p>
          {(search || filterStatus !== 'ALL') && (
            <button
              onClick={handleResetFilter}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md group"
            >
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider whitespace-nowrap shadow-2xs", STATUS_COLORS[job.status])}>
                        {job.status}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{job.platform}</span>
                    </div>
                  </div>

                  <h3 className="text-lg font-display font-black text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-4">
                    <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{job.company}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="truncate max-w-[130px]">{job.location || 'Lokasi tidak diatur'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium border-l border-slate-200 dark:border-slate-700 pl-3">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="tabular-nums">{new Date(job.dateApplied).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {(job.url || job.imageUrl) && (
                      <div className="flex gap-1.5">
                        {job.url && (
                           <button
                             onClick={() => setMediaViewer({ url: job.url })}
                             className="flex items-center justify-center p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                             title="Buka Link Lowongan"
                           >
                             <ExternalLink className="w-3.5 h-3.5" />
                           </button>
                        )}
                        {job.imageUrl && (
                           <button
                             onClick={() => setMediaViewer({ imageUrl: job.imageUrl })}
                             className="flex items-center justify-center p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                             title="Lihat Screenshot"
                           >
                             <ImageIcon className="w-3.5 h-3.5" />
                           </button>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEdit(job)}
                      className="px-4 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200/80 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => setJobToDelete(job)}
                      className="px-4 py-1.5 text-xs font-bold text-red-600 bg-red-50/80 border border-red-100 rounded-lg hover:bg-red-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {jobToDelete && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" 
              onClick={() => setJobToDelete(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 15, scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: typeof window !== 'undefined' && window.innerWidth < 768 ? '100%' : 15, scale: typeof window !== 'undefined' && window.innerWidth < 768 ? 1 : 0.95 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative bg-white rounded-t-3xl md:rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center border border-slate-100 z-10"
            >
              <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-display font-black text-slate-900">Hapus Lamaran Pekerjaan?</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                Apakah Anda yakin ingin menghapus lamaran <span className="font-bold text-slate-800">"{jobToDelete.title}"</span> di <span className="font-bold text-slate-800">{jobToDelete.company}</span>? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={() => setJobToDelete(null)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors flex-1 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    deleteJob(jobToDelete.id);
                    setJobToDelete(null);
                  }}
                  className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition-colors flex-1 shadow-sm cursor-pointer"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {mediaViewer && (
        <MediaViewer 
          url={mediaViewer.url} 
          imageUrl={mediaViewer.imageUrl} 
          onClose={() => setMediaViewer(null)} 
        />
      )}
    </div>
  );
}

