import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { JobStatus, JobApplication } from './types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_COLORS: Record<JobStatus, string> = {
  [JobStatus.DISIMPAN]: 'bg-slate-100 text-slate-700',
  [JobStatus.TERKIRIM]: 'bg-blue-100 text-blue-700',
  [JobStatus.TES]: 'bg-purple-100 text-purple-700',
  [JobStatus.WAWANCARA]: 'bg-orange-100 text-orange-700',
  [JobStatus.PENAWARAN]: 'bg-emerald-100 text-emerald-700',
  [JobStatus.DITERIMA]: 'bg-emerald-100 text-emerald-700',
  [JobStatus.DITOLAK]: 'bg-red-100 text-red-700',
};

export const PLATFORMS = [
  'LinkedIn',
  'Glints',
  'JobStreet',
  'Indeed',
  'Kalibrr',
  'Website Perusahaan',
  'Tech in Asia',
  'Lainnya'
];

export function exportToCSV(jobs: JobApplication[]) {
  const headers = [
    'ID', 'Posisi', 'Perusahaan', 'Platform', 'Lokasi', 'Ekspektasi Gaji',
    'Tanggal Melamar', 'Catatan', 'Status', 'URL', 'URL Gambar'
  ];
  
  const rows = jobs.map(job => [
    job.id,
    `"${job.title.replace(/"/g, '""')}"`,
    `"${job.company.replace(/"/g, '""')}"`,
    `"${job.platform}"`,
    `"${job.location.replace(/"/g, '""')}"`,
    `"${job.expectedSalary.replace(/"/g, '""')}"`,
    job.dateApplied,
    `"${job.notes.replace(/"/g, '""')}"`,
    job.status,
    `"${job.url || ''}"`,
    `"${job.imageUrl || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `job_tracker_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
