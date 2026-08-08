export enum JobStatus {
  DISIMPAN = 'DISIMPAN',
  TERKIRIM = 'TERKIRIM',
  TES = 'TES',
  WAWANCARA = 'WAWANCARA',
  PENAWARAN = 'PENAWARAN',
  DITERIMA = 'DITERIMA',
  DITOLAK = 'DITOLAK',
}

export interface JobApplication {
  id: string;
  title: string;
  company: string;
  platform: string;
  location: string;
  expectedSalary: string;
  dateApplied: string; // ISO date string
  notes: string;
  status: JobStatus;
  url?: string;
  imageUrl?: string;
}

export interface Reminder {
  id: string;
  jobId: string;
  date: string; // ISO string
  title: string;
  type: 'TES' | 'WAWANCARA' | 'DEADLINE';
  completed?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  acceptedTerms?: boolean;
  isGoogleUser?: boolean;
}

