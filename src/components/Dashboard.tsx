import React, { useMemo } from 'react';
import { useAppContext } from '../store';
import { JobStatus } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Award, Calendar, CheckCircle2, BarChart2 } from 'lucide-react';

const PLATFORM_GRADIENTS: Record<string, { start: string; stop: string }> = {
  'LinkedIn': { start: '#0A66C2', stop: '#38BDF8' },
  'Glints': { start: '#E11D48', stop: '#FB7185' },
  'JobStreet': { start: '#4F46E5', stop: '#818CF8' },
  'Indeed': { start: '#2563EB', stop: '#60A5FA' },
  'Kalibrr': { start: '#0D9488', stop: '#2DD4BF' },
  'Website Perusahaan': { start: '#EA580C', stop: '#F97316' },
  'Tech in Asia': { start: '#DC2626', stop: '#F87171' },
  'Lainnya': { start: '#475569', stop: '#94A3B8' },
};

const STATUS_COLORS_HEX: Record<JobStatus, string> = {
  [JobStatus.DISIMPAN]: '#9CA3AF',
  [JobStatus.TERKIRIM]: '#3B82F6',
  [JobStatus.TES]: '#EAB308',
  [JobStatus.WAWANCARA]: '#A855F7',
  [JobStatus.PENAWARAN]: '#F97316',
  [JobStatus.DITERIMA]: '#22C55E',
  [JobStatus.DITOLAK]: '#EF4444',
};

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const color = data.color || data.fill || (data.payload && data.payload.color) || '#3B82F6';
    const name = data.name || (data.payload && data.payload.name) || label || 'Data';
    const value = data.value !== undefined ? data.value : 0;

    return (
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-xl border border-slate-700/80 dark:border-slate-800 text-xs flex flex-col gap-1 z-50 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: typeof color === 'string' && color.startsWith('url') ? '#8B5CF6' : color }} />
          <span className="font-bold text-slate-200 dark:text-slate-100">{name}</span>
        </div>
        <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-800 dark:border-slate-800/80 text-[11px]">
          <span className="text-slate-400 font-medium">Jumlah:</span>
          <span className="font-black text-white text-xs tabular-nums">{value} Lamaran</span>
        </div>
      </div>
    );
  }
  return null;
};

export function Dashboard() {
  const { jobs } = useAppContext();

  const stats = useMemo(() => {
    const total = jobs.length;
    if (total === 0) {
      return {
        total: 0,
        responseRate: '0',
        interviewRate: '0',
        offerRate: '0',
        statusData: [],
        platformData: []
      };
    }

    let responses = 0;
    let interviews = 0;
    let offers = 0;

    const statusCounts: Record<string, number> = {};
    const platformCounts: Record<string, number> = {};

    jobs.forEach(job => {
      if (
        job.status === JobStatus.TES ||
        job.status === JobStatus.WAWANCARA ||
        job.status === JobStatus.PENAWARAN ||
        job.status === JobStatus.DITERIMA ||
        job.status === JobStatus.DITOLAK
      ) {
        responses++;
      }
      if (job.status === JobStatus.WAWANCARA || job.status === JobStatus.PENAWARAN || job.status === JobStatus.DITERIMA) {
        interviews++;
      }
      if (job.status === JobStatus.PENAWARAN || job.status === JobStatus.DITERIMA) {
        offers++;
      }

      statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
      platformCounts[job.platform] = (platformCounts[job.platform] || 0) + 1;
    });

    const statusData = Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        value: count,
        color: STATUS_COLORS_HEX[status as JobStatus] || '#94A3B8'
      }));

    const platformData = Object.entries(platformCounts)
      .map(([platform, count]) => ({
        name: platform,
        value: count
      }))
      .sort((a, b) => b.value - a.value);

    return {
      total,
      responseRate: ((responses / total) * 100).toFixed(1),
      interviewRate: ((interviews / total) * 100).toFixed(1),
      offerRate: ((offers / total) * 100).toFixed(1),
      statusData,
      platformData
    };
  }, [jobs]);

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="w-20 h-20 bg-gradient-to-tr from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/60 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400 shadow-inner border border-blue-100/50 dark:border-slate-700/50">
          <BarChart2 className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">Belum Ada Data Lamaran</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm text-sm font-medium leading-relaxed">Mulai tambahkan lamaran pekerjaan Anda untuk melacak statistik, status, dan statistik platform secara real-time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-20 md:pb-6">
      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Applied */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col items-start relative overflow-hidden group">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Applied</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-colors">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-display font-black text-slate-900 dark:text-white tabular-nums">{stats.total}</span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800">
            <div className="h-full bg-slate-900 dark:bg-white w-full" />
          </div>
        </div>

        {/* Response Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col items-start relative overflow-hidden group">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Response Rate</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-display font-black text-blue-600 dark:text-blue-400 tabular-nums">{stats.responseRate}%</span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-100 dark:bg-blue-950/40">
            <div className="h-full bg-blue-600 dark:bg-blue-400 transition-all duration-500" style={{ width: `${stats.responseRate}%` }} />
          </div>
        </div>

        {/* Interview Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col items-start relative overflow-hidden group">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interview Rate</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-display font-black text-purple-600 dark:text-purple-400 tabular-nums">{stats.interviewRate}%</span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-100 dark:bg-purple-950/40">
            <div className="h-full bg-purple-600 dark:bg-purple-400 transition-all duration-500" style={{ width: `${stats.interviewRate}%` }} />
          </div>
        </div>

        {/* Offer Rate */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col items-start relative overflow-hidden group">
          <div className="flex items-center justify-between w-full mb-3">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Offer Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl font-display font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{stats.offerRate}%</span>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-100 dark:bg-emerald-950/40">
            <div className="h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-500" style={{ width: `${stats.offerRate}%` }} />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Status Distribution Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs"></div>
            Distribusi Status
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={84}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Popularity Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all">
          <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs"></div>
            Platform Terpopuler
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.platformData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <defs>
                  {Object.entries(PLATFORM_GRADIENTS).map(([platform, colors]) => (
                    <linearGradient key={platform} id={`grad-${platform.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={colors.start} />
                      <stop offset="100%" stopColor={colors.stop} />
                    </linearGradient>
                  ))}
                  <linearGradient id="grad-default" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#60A5FA" />
                  </linearGradient>
                </defs>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={110} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(148, 163, 184, 0.15)' }}
                  content={<CustomChartTooltip />}
                />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
                  {stats.platformData.map((entry, index) => {
                    const cleanName = entry.name.replace(/\s+/g, '-');
                    const gradientId = PLATFORM_GRADIENTS[entry.name] ? `grad-${cleanName}` : 'grad-default';
                    return <Cell key={`cell-${index}`} fill={`url(#${gradientId})`} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
