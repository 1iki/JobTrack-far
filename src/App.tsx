import React, { useState } from 'react';
import { AppProvider, useAppContext } from './store';
import { Dashboard } from './components/Dashboard';
import { JobList } from './components/JobList';
import { JobForm } from './components/JobForm';
import { CalendarView } from './components/CalendarView';
import { ProfileView } from './components/ProfileView';
import { AuthView } from './components/AuthView';
import { TermsModal } from './components/TermsModal';
import { LayoutDashboard, Briefcase, Calendar as CalendarIcon, Plus, UserCircle, Menu, X, LogOut, Loader2, Sparkles, Sun, Moon, Laptop } from 'lucide-react';
import { JobApplication } from './types';
import { exportToCSV } from './utils';
import { motion, AnimatePresence } from 'motion/react';

function MainApp() {
  const { user, authLoading, setUserSession, updateUser, logout, notifySuccess, jobs, themeMode, setThemeMode } = useAppContext();
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'JOBS' | 'CALENDAR' | 'PROFILE'>('DASHBOARD');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState<JobApplication | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleAcceptTerms = async () => {
    try {
      const token = localStorage.getItem('jobtrack_auth_token');
      if (!token) {
        updateUser({ acceptedTerms: true });
        return;
      }
      const res = await fetch('/api/auth/accept-terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        updateUser({ acceptedTerms: true });
        notifySuccess('Terima kasih telah menyetujui Syarat & Ketentuan Layanan.', 'Persetujuan Berhasil');
      } else {
        updateUser({ acceptedTerms: true });
      }
    } catch (e) {
      console.error('Failed to accept terms:', e);
      updateUser({ acceptedTerms: true });
    }
  };

  const handleDeclineTerms = async () => {
    try {
      const token = localStorage.getItem('jobtrack_auth_token');
      if (token) {
        await fetch('/api/auth/account', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.error('Failed to delete account:', e);
    } finally {
      logout();
    }
  };

  const handleEditJob = (job: JobApplication) => {
    setJobToEdit(job);
    setIsFormOpen(true);
  };

  const handleOpenForm = () => {
    setJobToEdit(undefined);
    setIsFormOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3 bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
        >
          <div className="relative">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <Sparkles className="w-4 h-4 text-indigo-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="text-slate-600 font-bold text-sm tracking-wide">Memuat sesi...</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <AuthView onLogin={(userData, token) => setUserSession(userData, token)} />;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-blue-500 selection:text-white transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800 sticky top-0 z-30 transition-all duration-300 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setActiveTab('DASHBOARD')}>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-md shadow-blue-600/10"
            >
              <img src="/assets/img/icon.png" alt="JobTracker Logo" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="text-xl font-display font-black tracking-tight text-slate-900 dark:text-white">
              JobTracker <span className="text-blue-600 dark:text-blue-400">by FAR</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOpenForm}
              className="hidden md:flex items-center gap-2 bg-slate-900 dark:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 dark:hover:bg-blue-500 transition-all shadow-md shadow-slate-900/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Lowongan
            </motion.button>

            <div className="flex items-center gap-2">
              {/* Header Minimalist Theme Switcher Button */}
              <button
                onClick={() => {
                  const nextMode = themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
                  setThemeMode(nextMode);
                }}
                className="p-2 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                title={`Tema saat ini: ${themeMode === 'system' ? 'Otomatis (Sistem)' : themeMode === 'light' ? 'Terang (Light)' : 'Gelap (Dark)'}`}
              >
                {themeMode === 'system' && <Laptop className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                {themeMode === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
                {themeMode === 'dark' && <Moon className="w-5 h-5 text-indigo-400" />}
              </button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('PROFILE')}
                className="flex items-center gap-2.5 p-1.5 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-full transition-all text-slate-700 dark:text-slate-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                title="Profil"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-xs" />
                ) : (
                  <UserCircle className="w-8 h-8 text-slate-500 dark:text-slate-400" />
                )}
                <span className="hidden sm:inline-block text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[120px] truncate pr-1">{user.name}</span>
              </motion.button>

              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-all hidden sm:flex cursor-pointer"
                title="Keluar"
              >
                <LogOut className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsSidebarOpen(true)}
                className="hidden md:flex p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer"
                title="Menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 relative">
        <div key={activeTab} className="transition-all duration-200">
          {activeTab === 'DASHBOARD' && <Dashboard />}
          {activeTab === 'JOBS' && (
            <JobList
              onEdit={handleEditJob}
              onExport={() => {
                exportToCSV(jobs);
              }}
            />
          )}
          {activeTab === 'CALENDAR' && <CalendarView />}
          {activeTab === 'PROFILE' && <ProfileView />}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-around pb-safe pt-2 px-2 z-40 shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.08)]">
        <button
          onClick={() => setActiveTab('DASHBOARD')}
          className={`flex flex-col items-center p-2 min-w-[64px] transition-all duration-200 relative ${activeTab === 'DASHBOARD' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <LayoutDashboard className="w-5 h-5 mb-1" strokeWidth={activeTab === 'DASHBOARD' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">Beranda</span>
          {activeTab === 'DASHBOARD' && (
            <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('JOBS')}
          className={`flex flex-col items-center p-2 min-w-[64px] transition-all duration-200 relative ${activeTab === 'JOBS' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <Briefcase className="w-5 h-5 mb-1" strokeWidth={activeTab === 'JOBS' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">Lowongan</span>
          {activeTab === 'JOBS' && (
            <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('CALENDAR')}
          className={`flex flex-col items-center p-2 min-w-[64px] transition-all duration-200 relative ${activeTab === 'CALENDAR' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <CalendarIcon className="w-5 h-5 mb-1" strokeWidth={activeTab === 'CALENDAR' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">Kalender</span>
          {activeTab === 'CALENDAR' && (
            <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`flex flex-col items-center p-2 min-w-[64px] transition-all duration-200 relative ${activeTab === 'PROFILE' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          <UserCircle className="w-5 h-5 mb-1" strokeWidth={activeTab === 'PROFILE' ? 2.5 : 2} />
          <span className="text-[10px] font-bold tracking-tight">Profil</span>
          {activeTab === 'PROFILE' && (
            <motion.div layoutId="mobileNavIndicator" className="absolute top-0 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-full" />
          )}
        </button>
      </nav>

      {/* Mobile FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={handleOpenForm}
        className="md:hidden fixed bottom-20 right-5 w-14 h-14 bg-gradient-to-tr from-slate-900 to-slate-800 dark:from-blue-600 dark:to-indigo-600 text-white rounded-2xl shadow-xl shadow-slate-900/30 flex items-center justify-center z-40 border border-slate-700/50 cursor-pointer"
      >
        <Plus className="w-7 h-7" />
      </motion.button>

      {/* Forms & Modals */}
      <AnimatePresence>
        {isFormOpen && (
          <JobForm jobToEdit={jobToEdit} onClose={() => setIsFormOpen(false)} />
        )}
      </AnimatePresence>

      {/* Desktop Sidebar Navigation Drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 hidden md:block"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-900 shadow-2xl z-50 hidden md:flex flex-col border-l border-slate-100 dark:border-slate-800"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                  ) : (
                    <UserCircle className="w-8 h-8 text-slate-400" />
                  )}
                  <div className="overflow-hidden">
                    <span className="font-bold text-slate-900 dark:text-white text-sm truncate block max-w-[140px]">{user.name}</span>
                    <span className="text-[11px] text-slate-400 block truncate">{user.email}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 p-4 flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    setActiveTab('DASHBOARD');
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === 'DASHBOARD' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'}`}
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Beranda
                </button>
                <button
                  onClick={() => {
                    setActiveTab('JOBS');
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === 'JOBS' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'}`}
                >
                  <Briefcase className="w-5 h-5" />
                  Lowongan
                </button>
                <button
                  onClick={() => {
                    setActiveTab('CALENDAR');
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === 'CALENDAR' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'}`}
                >
                  <CalendarIcon className="w-5 h-5" />
                  Kalender
                </button>
                <button
                  onClick={() => {
                    setActiveTab('PROFILE');
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeTab === 'PROFILE' ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium'}`}
                >
                  <UserCircle className="w-5 h-5" />
                  Profil
                </button>

                {/* Minimalist Theme Customizer Section (Icon Only) */}
                <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-3">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                      Tema Tampilan
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full capitalize">
                      {themeMode === 'system' ? 'Otomatis' : themeMode === 'light' ? 'Terang' : 'Gelap'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => setThemeMode('system')}
                      className={`flex-1 flex justify-center py-2 rounded-lg transition-all cursor-pointer ${
                        themeMode === 'system'
                          ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                      title="Otomatis mengikuti tema device"
                    >
                      <Laptop className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setThemeMode('light')}
                      className={`flex-1 flex justify-center py-2 rounded-lg transition-all cursor-pointer ${
                        themeMode === 'light'
                          ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-xs'
                          : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                      title="Tema Terang (Light Mode)"
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setThemeMode('dark')}
                      className={`flex-1 flex justify-center py-2 rounded-lg transition-all cursor-pointer ${
                        themeMode === 'dark'
                          ? 'bg-slate-900 text-indigo-400 shadow-xs'
                          : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                      title="Tema Gelap (Dark Mode)"
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 mt-auto pt-3">
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-bold text-sm cursor-pointer"
                  >
                    <LogOut className="w-5 h-5" />
                    Keluar
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <TermsModal
        isOpen={!user.acceptedTerms}
        onAccept={handleAcceptTerms}
        onDecline={handleDeclineTerms}
        isGoogleUser={!!user.isGoogleUser}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}


