import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { JobApplication, Reminder, User } from './types';
import { v4 as uuidv4 } from 'uuid';
import { NotificationModal, NotificationState } from './components/NotificationModal';

export type ThemeMode = 'system' | 'light' | 'dark';

interface AppState {
  user: User | null;
  authLoading: boolean;
  jobs: JobApplication[];
  reminders: Reminder[];
  notification: NotificationState | null;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  notifySuccess: (message: string, title?: string) => void;
  notifyError: (message: string, title?: string) => void;
  closeNotification: () => void;
  setUserSession: (user: User, token: string) => void;
  updateUser: (updates: Partial<User>) => void;
  logout: () => void;
  addJob: (job: Omit<JobApplication, 'id'>) => Promise<boolean>;
  updateJob: (id: string, job: Partial<JobApplication>) => Promise<boolean>;
  deleteJob: (id: string) => Promise<boolean>;
  addReminder: (reminder: Omit<Reminder, 'id'>) => Promise<boolean>;
  deleteReminder: (id: string) => Promise<boolean>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Theme Management (Automatic Device Theme & Custom Toggle)
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    return (localStorage.getItem('jobtracker_theme') as ThemeMode) || 'system';
  });

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem('jobtracker_theme', mode);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      let isDark = false;
      if (themeMode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = themeMode === 'dark';
      }

      if (isDark) {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  const notifySuccess = useCallback((message: string, title = 'Success Edit') => {
    setNotification({
      isOpen: true,
      type: 'success',
      title,
      message
    });
  }, []);

  const notifyError = useCallback((message: string, title = 'Failed Edit') => {
    setNotification({
      isOpen: true,
      type: 'error',
      title,
      message
    });
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(prev => prev ? { ...prev, isOpen: false } : null);
  }, []);

  // Verify stored session token on mount
  useEffect(() => {
    const token = localStorage.getItem('jobtrack_auth_token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Invalid session');
        })
        .then(data => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('jobtrack_auth_token');
          setUser(null);
        })
        .finally(() => {
          setAuthLoading(false);
        });
    } else {
      setAuthLoading(false);
    }
  }, []);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('jobtrack_auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const setUserSession = (userData: User, token: string) => {
    localStorage.setItem('jobtrack_auth_token', token);
    setUser(userData);
  };

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const logout = () => {
    localStorage.removeItem('jobtrack_auth_token');
    setUser(null);
    setJobs([]);
    setReminders([]);
  };

  const refreshData = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const [jobsRes, remindersRes] = await Promise.all([
        fetch('/api/jobs', { headers }),
        fetch('/api/reminders', { headers })
      ]);
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }
      if (remindersRes.ok) {
        const remindersData = await remindersRes.json();
        setReminders(remindersData);
      }
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  const addJob = async (job: Omit<JobApplication, 'id'>): Promise<boolean> => {
    const tempId = uuidv4();
    const newTempJob = { ...job, id: tempId } as JobApplication;
    setJobs(prev => [newTempJob, ...prev]);
    
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(job)
      });
      if (res.ok) {
        const newJob = await res.json();
        setJobs(prev => prev.map(j => j.id === tempId ? newJob : j));
        notifySuccess('Lamaran pekerjaan berhasil ditambahkan!', 'Success Submit');
        return true;
      } else {
        refreshData();
        notifyError('Gagal menambahkan lamaran pekerjaan.', 'Failed Submit');
        return false;
      }
    } catch (e) { 
      console.error('Failed to add job', e); 
      refreshData();
      notifyError('Terjadi kesalahan saat menambahkan lamaran.', 'Failed Submit');
      return false;
    }
  };

  const updateJob = async (id: string, updates: Partial<JobApplication>): Promise<boolean> => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        notifySuccess('Perubahan lamaran berhasil disimpan!', 'Success Edit');
        return true;
      } else {
        refreshData();
        notifyError('Gagal menyimpan perubahan lamaran.', 'Failed Edit');
        return false;
      }
    } catch (e) { 
      console.error('Failed to update job', e);
      refreshData();
      notifyError('Terjadi kesalahan saat memperbarui lamaran.', 'Failed Edit');
      return false;
    }
  };

  const deleteJob = async (id: string): Promise<boolean> => {
    setJobs(prev => prev.filter(j => j.id !== id));
    setReminders(prev => prev.filter(r => r.jobId !== id));
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        notifySuccess('Lamaran pekerjaan berhasil dihapus.', 'Berhasil Hapus');
        return true;
      } else {
        refreshData();
        notifyError('Gagal menghapus lamaran pekerjaan.', 'Gagal Hapus');
        return false;
      }
    } catch (e) { 
      console.error('Failed to delete job', e);
      refreshData();
      notifyError('Terjadi kesalahan saat menghapus lamaran.', 'Gagal Hapus');
      return false;
    }
  };

  const addReminder = async (reminder: Omit<Reminder, 'id'>): Promise<boolean> => {
    const tempId = uuidv4();
    const newTempReminder = { ...reminder, id: tempId } as Reminder;
    setReminders(prev => [...prev, newTempReminder]);
    
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(reminder)
      });
      if (res.ok) {
        const newReminder = await res.json();
        setReminders(prev => prev.map(r => r.id === tempId ? newReminder : r));
        notifySuccess('Pengingat baru berhasil dibuat!', 'Success Submit');
        return true;
      } else {
        refreshData();
        notifyError('Gagal membuat pengingat baru.', 'Failed Submit');
        return false;
      }
    } catch (e) { 
      console.error('Failed to add reminder', e); 
      refreshData();
      notifyError('Terjadi kesalahan saat menyimpan pengingat.', 'Failed Submit');
      return false;
    }
  };

  const deleteReminder = async (id: string): Promise<boolean> => {
    setReminders(prev => prev.filter(r => r.id !== id));
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        notifySuccess('Pengingat berhasil dihapus.', 'Berhasil Hapus');
        return true;
      } else {
        refreshData();
        notifyError('Gagal menghapus pengingat.', 'Gagal Hapus');
        return false;
      }
    } catch (e) { 
      console.error('Failed to delete reminder', e);
      refreshData();
      notifyError('Terjadi kesalahan saat menghapus pengingat.', 'Gagal Hapus');
      return false;
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>): Promise<boolean> => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    try {
      const res = await fetch(`/api/reminders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        notifySuccess('Pengingat berhasil diperbarui!', 'Success Edit');
        return true;
      } else {
        refreshData();
        notifyError('Gagal memperbarui pengingat.', 'Failed Edit');
        return false;
      }
    } catch (e) { 
      console.error('Failed to update reminder', e);
      refreshData();
      notifyError('Terjadi kesalahan saat memperbarui pengingat.', 'Failed Edit');
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        authLoading,
        jobs,
        reminders,
        themeMode,
        setThemeMode,
        notifySuccess,
        notifyError,
        closeNotification,
        setUserSession,
        updateUser,
        logout,
        addJob,
        updateJob,
        deleteJob,
        addReminder,
        deleteReminder,
        updateReminder,
        refreshData
      }}
    >
      {children}
      <NotificationModal notification={notification} onClose={closeNotification} />
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}


