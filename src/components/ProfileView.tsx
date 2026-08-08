import React, { useState, useEffect, useRef } from 'react';
import {
  User, Mail, Phone, MapPin, Briefcase, GraduationCap,
  Award, Users, FileText, ExternalLink, Calendar, Plus, Edit2, Download, X, Trash2,
  Lock, ShieldCheck
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useAppContext } from '../store';

import { motion, AnimatePresence } from 'motion/react';

function Modal({ title, isOpen, onClose, children, onSave }: { title: string, isOpen: boolean, onClose: () => void, children: React.ReactNode, onSave: () => void }) {
  const isMobileOrTablet = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
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
            className="relative bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-t-3xl md:rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-2xl z-10 border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-display font-black text-lg md:text-xl text-slate-900 dark:text-white">{title}</h3>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 text-sm">
              {children}
            </div>
            <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50">
              <button onClick={onClose} className="px-5 py-2.5 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer">
                Batal
              </button>
              <button onClick={() => { onSave(); onClose(); }} className="px-5 py-2.5 bg-blue-600 text-white font-bold hover:bg-blue-700 rounded-xl transition-colors shadow-xs cursor-pointer">
                Simpan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function ProfileView() {
  const { notifySuccess, notifyError } = useAppContext();
  const [profile, setProfile] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for modals
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");

  const [editBasic, setEditBasic] = useState<any>({});
  const [editAbout, setEditAbout] = useState("");

  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editExp, setEditExp] = useState<any>({});
  const [editEdu, setEditEdu] = useState<any>({});
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [editCert, setEditCert] = useState<any>({});
  const [editVol, setEditVol] = useState<any>({});
  const [editPortSocial, setEditPortSocial] = useState<any>({ category: 'portfolio', title: '', url: '', originalCategory: 'portfolio', index: null });
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('jobtrack_auth_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });
      const data = await response.json();
      if (data.secure_url) {
        await saveProfile({ ...profile, profileImage: data.secure_url }, 'Foto profil berhasil diperbarui!');
      } else {
        notifyError(data.error || "Gagal mengunggah foto profil.", "Failed Edit");
      }
    } catch (error) {
      console.error("Upload error:", error);
      notifyError("Terjadi kesalahan saat mengunggah foto profil.", "Failed Edit");
    } finally {
      setIsUploading(false);
    }
  };

  const saveProfile = async (updatedData: any, customSuccessMsg?: string) => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        setProfile(updatedData); // optimistic update
        notifySuccess(customSuccessMsg || 'Data profil berhasil diperbarui!', 'Success Edit');
      } else {
        notifyError('Gagal menyimpan profil ke database.', 'Failed Edit');
      }
    } catch (e) {
      console.error(e);
      notifyError('Terjadi kesalahan saat menyimpan profil.', 'Failed Edit');
    }
  };


  const handleDelete = (field: string, index: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus item ini?')) return;
    const updatedArray = profile[field].filter((_: any, i: number) => i !== index);
    const updatedProfile = { ...profile, [field]: updatedArray };
    if (field === 'education' && updatedArray.length > 0 && (!profile.highestEducation || profile.highestEducation === profile.education?.[index]?.degree)) {
      updatedProfile.highestEducation = updatedArray[0].degree ? `${updatedArray[0].degree} - ${updatedArray[0].school}` : updatedArray[0].school;
    }
    saveProfile(updatedProfile);
  };

  const handleSaveItem = (field: string, itemState: any) => {
    const newArray = [...(profile[field] || [])];
    if (editIndex !== null) {
      newArray[editIndex] = itemState;
    } else {
      newArray.unshift(itemState);
    }
    const updatedProfile = { ...profile, [field]: newArray };
    if (field === 'education' && (!profile.highestEducation || editIndex === 0)) {
      updatedProfile.highestEducation = itemState.degree ? `${itemState.degree} - ${itemState.school}` : itemState.school;
    }
    saveProfile(updatedProfile);
  };

  const handleViewOrDownloadCv = async (cvItem: any) => {
    try {
      const res = await fetch(cvItem.url, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        alert("Gagal mengunduh CV dari database terenkripsi.");
        return;
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan saat mendekripsi CV");
    }
  };

  const handleDeleteCv = async (index: number, cvItem: any) => {
    if (!confirm('Apakah Anda yakin ingin menghapus dokumen CV terenkripsi ini?')) return;
    if (cvItem.cvId) {
      try {
        await fetch(`/api/cv/${cvItem.cvId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (e) {
        console.error("Error deleting CV record:", e);
      }
    }
    const updatedCvs = (profile.cvs || []).filter((_: any, i: number) => i !== index);
    saveProfile({ ...profile, cvs: updatedCvs });
  };

  const handleSavePortSocial = async () => {
    const { category, originalCategory, title, url, cvId, index } = editPortSocial;

    let updatedPortfolio = [...(profile.portfolio || [])];
    let updatedSocials = [...(profile.socials || [])];
    let updatedCvs = [...(profile.cvs || [])];

    if (index !== null && originalCategory) {
      if (originalCategory === 'portfolio') {
        updatedPortfolio = updatedPortfolio.filter((_: any, i: number) => i !== index);
      } else if (originalCategory === 'social') {
        updatedSocials = updatedSocials.filter((_: any, i: number) => i !== index);
      } else if (originalCategory === 'cv') {
        updatedCvs = updatedCvs.filter((_: any, i: number) => i !== index);
      }
    }

    if (category === 'cv') {
      let cvUrl = url;
      let newCvId = cvId;
      let filename = editPortSocial.filename || 'CV.pdf';

      if (selectedCvFile) {
        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append('file', selectedCvFile);
          formData.append('title', title.trim() || selectedCvFile.name);

          const res = await fetch('/api/cv/upload', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: formData
          });

          const data = await res.json();
          if (!res.ok) {
            alert(data.error || "Gagal mengunggah & mengenkripsi CV");
            setIsUploading(false);
            return;
          }

          cvUrl = data.url;
          newCvId = data.cvId;
          filename = data.filename;
        } catch (err) {
          console.error(err);
          alert("Terjadi kesalahan saat mengunggah CV");
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else if (!cvUrl && !newCvId) {
        alert("Silakan pilih file CV yang ingin diunggah.");
        return;
      }

      const newCvItem = {
        title: title.trim() || filename,
        filename,
        cvId: newCvId,
        url: cvUrl,
        category: 'cv'
      };

      if (index !== null && originalCategory === 'cv') {
        updatedCvs.splice(index, 0, newCvItem);
      } else {
        updatedCvs.unshift(newCvItem);
      }
    } else if (category === 'portfolio') {
      if (!title.trim() || !url.trim()) return;
      const newItem = { title: title.trim(), url: url.trim() };
      if (index !== null && originalCategory === 'portfolio') {
        updatedPortfolio.splice(index, 0, newItem);
      } else {
        updatedPortfolio.unshift(newItem);
      }
    } else {
      if (!title.trim() || !url.trim()) return;
      const newItem = { platform: title.trim(), url: url.trim() };
      if (index !== null && originalCategory === 'social') {
        updatedSocials.splice(index, 0, newItem);
      } else {
        updatedSocials.unshift(newItem);
      }
    }

    saveProfile({
      ...profile,
      portfolio: updatedPortfolio,
      socials: updatedSocials,
      cvs: updatedCvs
    });
    setSelectedCvFile(null);
  };

  const openEditModal = (modalName: string, item: any, index: number | null) => {
    setEditIndex(index);
    if (modalName === 'Work') setEditExp(item || {});
    if (modalName === 'Education') setEditEdu(item || {});
    if (modalName === 'PortSocial') {
      setSelectedCvFile(null);
      if (item) {
        const isCv = item.category === 'cv' || item.cvId !== undefined;
        const isPortfolio = !isCv && item.title !== undefined && item.platform === undefined;
        setEditPortSocial({
          category: isCv ? 'cv' : (isPortfolio ? 'portfolio' : 'social'),
          originalCategory: isCv ? 'cv' : (isPortfolio ? 'portfolio' : 'social'),
          title: isCv ? (item.title || item.filename || '') : (isPortfolio ? (item.title || '') : (item.platform || '')),
          url: item.url || '',
          cvId: item.cvId || null,
          filename: item.filename || '',
          index: index
        });
      } else {
        setEditPortSocial({
          category: 'portfolio',
          originalCategory: null,
          title: '',
          url: '',
          cvId: null,
          filename: '',
          index: null
        });
      }
    }
    if (modalName === 'Certificate') setEditCert(item || {});
    if (modalName === 'Volunteer') setEditVol(item || {});
    setActiveModal(modalName);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = () => {
    if (!profile || isExporting) return;
    setIsExporting(true);

    // SEC-008: HTML sanitization helper to prevent XSS in PDF export
    const esc = (str: string | undefined | null): string => {
      if (!str) return '';
      return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    };

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; color: #000; padding: 40px; font-size: 14px; line-height: 1.5; background-color: white;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 24px; font-weight: bold; text-transform: uppercase; margin: 0 0 8px 0; letter-spacing: 1px;">${esc(profile.name) || 'Nama Lengkap'}</h1>
          <p style="font-size: 13px; margin: 0;">
            ${esc(profile.location) || 'Lokasi'} | <span style="color: #2563eb;">${esc(profile.phone) || 'No. Telp'}</span> | <span style="color: #2563eb;">${esc(profile.email) || 'Email'}</span>
          </p>
        </div>

        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 15px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 0 0 12px 0;">Tentang Saya</h2>
          <div style="font-size: 13px;">
            ${(profile.about || '').split('\n').map((line: string) => `<p style="margin: 0 0 4px 0;">${esc(line)}</p>`).join('')}
          </div>
        </div>

        ${profile.experiences?.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 15px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 0 0 12px 0;">Pengalaman Kerja</h2>
          ${profile.experiences.map((exp: any) => `
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 2px 0;">${esc(exp.company)}</h3>
            <p style="font-size: 13px; margin: 0;">${esc(exp.title)} | ${esc(exp.period)}</p>
          </div>
          `).join('')}
        </div>` : ''}

        ${profile.education?.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 15px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 0 0 12px 0;">Pendidikan</h2>
          ${profile.education.map((edu: any) => `
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 2px 0;">${esc(edu.school)}</h3>
            <p style="font-size: 13px; margin: 0;">${esc(edu.degree)} | ${esc(edu.period)}</p>
          </div>
          `).join('')}
        </div>` : ''}

        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 15px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 0 0 12px 0;">Kemampuan</h2>
          <div style="font-size: 13px;">
            ${(profile.skills || []).map((s: string) => esc(s)).join(', ')}
          </div>
        </div>
        
        <div style="page-break-before: always;"></div>

        ${profile.certificates?.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 15px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 0 0 12px 0;">Sertifikat</h2>
          ${profile.certificates.map((cert: any) => `
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 2px 0;">${esc(cert.title)}</h3>
            <p style="font-size: 13px; margin: 0 0 2px 0;">${esc(cert.issuer)} | ${esc(cert.period)}</p>
          </div>
          `).join('')}
        </div>` : ''}

        ${profile.volunteering?.length > 0 ? `
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 15px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; margin: 0 0 12px 0;">Pengalaman Organisasi & Relawan</h2>
          ${profile.volunteering.map((vol: any) => `
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 2px 0;">${esc(vol.role)}</h3>
            <p style="font-size: 13px; margin: 0;">${esc(vol.organization)} | ${esc(vol.period)}</p>
          </div>
          `).join('')}
        </div>` : ''}
      </div>
    `;

    document.body.appendChild(element);

    const opt = {
      margin: 10,
      filename: `CV_${(profile.name || 'Profil').replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
    };

    html2pdf().from(element).set(opt).save().then(() => {
      document.body.removeChild(element);
      setIsExporting(false);
    }).catch((err: any) => {
      console.error('PDF Export Error:', err);
      if (document.body.contains(element)) document.body.removeChild(element);
      setIsExporting(false);
    });
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-medium flex items-center justify-center min-h-screen">Memuat profil dari database...</div>;
  if (!profile) return <div className="p-8 text-center text-slate-500 font-medium flex items-center justify-center min-h-screen">Gagal memuat profil atau belum ada database. Pastikan MONGODB_URI telah di set.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-6">

      {/* Profile Header Card */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden group hover:shadow-md transition-all">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          <div className="relative shrink-0 group/avatar">
            <img
              src={profile.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
              alt="Profile"
              className={`w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-md ${isUploading ? 'opacity-50' : ''}`}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors opacity-100 sm:opacity-0 sm:group-hover/avatar:opacity-100 disabled:opacity-50 cursor-pointer"
              title="Ubah Foto Profil"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-black text-slate-900 dark:text-white tracking-tight">{profile.name || 'Nama Anda'}</h1>
                <p className="text-blue-600 dark:text-blue-400 font-bold text-base md:text-lg mt-0.5">{profile.title || 'Posisi / Peran Anda'}</p>
              </div>
              <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button onClick={() => {
                  setEditBasic({ name: profile.name, title: profile.title, phone: profile.phone, email: profile.email, location: profile.location, highestEducation: profile.highestEducation || '' });
                  setActiveModal('editBasic');
                }} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer">
                  <Edit2 className="w-3.5 h-3.5" /> Ubah data diri
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm text-slate-600 dark:text-slate-300 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="font-medium tabular-nums">{profile.phone || '-'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="truncate font-medium">{profile.email || '-'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="font-medium">{profile.location || '-'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                <span className="font-medium">Pendidikan Terakhir: {profile.highestEducation || profile.education?.[0]?.degree?.split(' ')?.[0] || '-'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" /> {isExporting ? 'Mengekspor PDF...' : 'Ekspor ke PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Tentang Saya */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-black text-slate-900 dark:text-white">Tentang Saya</h2>
              <button onClick={() => { setEditAbout(profile.about || ""); setActiveModal('editAbout'); }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-xs font-bold flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">
              {profile.about ? profile.about.split('\n').map((para: string, idx: number) => (
                <p key={idx}>{para}</p>
              )) : <p className="text-slate-400 dark:text-slate-500 italic">Belum ada deskripsi tentang diri Anda.</p>}
            </div>
          </section>

          {/* Pengalaman Kerja */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-black text-slate-900 dark:text-white">Pengalaman Kerja</h2>
              <button onClick={() => openEditModal('Work', null, null)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-bold flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-6">
              {profile.experiences?.length > 0 ? profile.experiences.map((exp: any, idx: number) => (
                <div key={idx} className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 group/item">
                  <div className={`absolute w-3 h-3 ${idx === 0 ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-200 dark:bg-slate-700'} rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_white] dark:shadow-[0_0_0_4px_#0f172a]`}></div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{exp.title}</h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{exp.company}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {exp.period}
                      </p>
                    </div>
                    <div className="opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 flex gap-1 transition-all shrink-0">
                      <button onClick={() => openEditModal('Work', exp, idx)} className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('experiences', idx)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : <p className="text-slate-400 dark:text-slate-500 italic text-sm">Belum ada pengalaman kerja yang ditambahkan.</p>}
            </div>
          </section>

          {/* Pendidikan */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-black text-slate-900 dark:text-white">Pendidikan</h2>
              <button onClick={() => openEditModal('Education', null, null)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-bold flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-6">
              {profile.education?.length > 0 ? profile.education.map((edu: any, idx: number) => (
                <div key={idx} className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 group/item">
                  <div className={`absolute w-3 h-3 ${idx === 0 ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-200 dark:bg-slate-700'} rounded-full -left-[7px] top-1.5 shadow-[0_0_0_4px_white] dark:shadow-[0_0_0_4px_#0f172a]`}></div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{edu.school}</h3>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{edu.degree}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> {edu.period}
                      </p>
                    </div>
                    <div className="opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 flex gap-1 transition-all shrink-0">
                      <button onClick={() => openEditModal('Education', edu, idx)} className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg cursor-pointer">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete('education', idx)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )) : <p className="text-slate-400 dark:text-slate-500 italic text-sm">Belum ada riwayat pendidikan yang ditambahkan.</p>}
            </div>
          </section>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          {/* Skills */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-black text-slate-900 dark:text-white">Skills</h2>
              <button onClick={() => { setEditSkills([...(profile.skills || [])]); setActiveModal('editSkills'); }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-bold flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.skills?.length > 0 ? profile.skills.map((skill: string) => (
                <span key={skill} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold whitespace-nowrap">
                  {skill}
                </span>
              )) : <p className="text-slate-400 dark:text-slate-500 italic text-sm">Belum ada skill.</p>}
            </div>
          </section>

          {/* Minat */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-black text-slate-900 dark:text-white leading-tight">Bidang Minat</h2>
              <button onClick={() => { setEditInterests([...(profile.interests || [])]); setActiveModal('editInterests'); }} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-bold flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {profile.interests?.length > 0 ? (
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 ml-2 space-y-1">
                  {profile.interests.map((interest: string, idx: number) => (
                    <li key={idx} className="text-sm">{interest}</li>
                  ))}
                </ul>
              ) : <p className="text-slate-400 dark:text-slate-500 italic text-sm">Belum ada minat yang ditambahkan.</p>}
            </div>
          </section>

          {/* Portofolio & Link */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-black text-slate-900 dark:text-white leading-tight">Portofolio & Sosmed</h2>
              <button
                onClick={() => openEditModal('PortSocial', null, null)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-bold flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Tambah Portofolio / Sosmed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Dokumen CV Terenkripsi */}
              {profile.cvs?.map((cvItem: any, idx: number) => (
                <div key={`cv-${idx}`} className="relative flex items-center justify-between p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-blue-950/40 dark:to-indigo-950/40 group/item transition-all hover:border-blue-300 shadow-xs">
                  <div className="flex items-center gap-3 overflow-hidden flex-1 pr-12">
                    <div className="w-10 h-10 bg-blue-600 dark:bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-black tracking-wider text-blue-700 dark:text-blue-300 bg-blue-100/90 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md uppercase flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" /> Encrypted DB
                        </span>
                      </div>
                      <button
                        onClick={() => handleViewOrDownloadCv(cvItem)}
                        className="text-sm font-bold text-slate-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 text-left block w-full cursor-pointer"
                        title="Klik untuk melihat/mengunduh CV terenkripsi"
                      >
                        {cvItem.title || cvItem.filename || 'Dokumen CV'}
                      </button>
                    </div>
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 flex gap-1 transition-all bg-white dark:bg-slate-800 shadow-sm p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleViewOrDownloadCv(cvItem)}
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded transition-colors cursor-pointer"
                      title="Lihat / Unduh CV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCv(idx, cvItem)}
                      className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded transition-colors cursor-pointer"
                      title="Hapus CV"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {profile.portfolio?.map((port: any, idx: number) => (
                <div key={`port-${idx}`} className="relative group/item">
                  <a href={port.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                      <ExternalLink className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden pr-12 flex-1">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Portofolio</p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400 truncate hover:underline">{port.title}</p>
                    </div>
                  </a>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 flex gap-1 transition-all bg-white dark:bg-slate-800 shadow-sm p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                    <button onClick={(e) => { e.preventDefault(); openEditModal('PortSocial', port, idx); }} className="p-1 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.preventDefault(); handleDelete('portfolio', idx); }} className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {profile.socials?.map((soc: any, idx: number) => (
                <div key={`soc-${idx}`} className="relative flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/80 group/item">
                  <div className="w-10 h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden flex-1 pr-12">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{soc.platform}</p>
                    <a href={soc.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate hover:underline block">{soc.url}</a>
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 flex gap-1 transition-all bg-white dark:bg-slate-800 shadow-sm p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                    <button onClick={() => openEditModal('PortSocial', soc, idx)} className="p-1 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded cursor-pointer">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete('socials', idx)} className="p-1 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {(!profile.portfolio?.length && !profile.socials?.length && !profile.cvs?.length) && <p className="text-slate-400 dark:text-slate-500 italic text-sm">Belum ada portofolio, media sosial, atau CV.</p>}
            </div>
          </section>

          {/* Sertifikat */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-black text-slate-900 dark:text-white">Sertifikat</h2>
              <button onClick={() => openEditModal('Certificate', null, null)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-bold flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {profile.certificates?.length > 0 ? profile.certificates.map((cert: any, idx: number) => (
                <div key={idx} className="pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0 flex items-start justify-between gap-4 group/item">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{cert.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{cert.issuer} • {cert.period}</p>
                  </div>
                  <div className="opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 flex gap-1 transition-all shrink-0">
                    <button onClick={() => openEditModal('Certificate', cert, idx)} className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete('certificates', idx)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : <p className="text-slate-400 dark:text-slate-500 italic text-sm">Belum ada sertifikat.</p>}
            </div>
          </section>

          {/* Pengalaman Organisasi */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 group hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-black text-slate-900 dark:text-white leading-tight">Organisasi & Relawan</h2>
              <button onClick={() => openEditModal('Volunteer', null, null)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm font-bold flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity cursor-pointer">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              {profile.volunteering?.length > 0 ? profile.volunteering.map((vol: any, idx: number) => (
                <div key={idx} className="pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0 flex items-start justify-between gap-4 group/item">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{vol.organization}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">{vol.role}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{vol.period}</p>
                  </div>
                  <div className="opacity-100 lg:opacity-0 lg:group-hover/item:opacity-100 flex gap-1 transition-all shrink-0">
                    <button onClick={() => openEditModal('Volunteer', vol, idx)} className="p-1.5 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete('volunteering', idx)} className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )) : <p className="text-slate-400 dark:text-slate-500 italic text-sm">Belum ada pengalaman organisasi.</p>}
            </div>
          </section>

        </div>
      </div>

      {/* Modals */}
      <Modal title="Ubah Data Diri" isOpen={activeModal === 'editBasic'} onClose={() => setActiveModal(null)} onSave={() => saveProfile({ ...profile, ...editBasic })}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Lengkap</label>
            <input type="text" value={editBasic.name || ""} onChange={e => setEditBasic({ ...editBasic, name: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Pendidikan Terakhir</label>
            <input type="text" value={editBasic.highestEducation || ""} onChange={e => setEditBasic({ ...editBasic, highestEducation: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Posisi/Jabatan</label>
            <input type="text" value={editBasic.title || ""} onChange={e => setEditBasic({ ...editBasic, title: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">No. Telepon</label>
            <input type="text" value={editBasic.phone || ""} onChange={e => setEditBasic({ ...editBasic, phone: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium tabular-nums" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
            <input type="email" value={editBasic.email || ""} onChange={e => setEditBasic({ ...editBasic, email: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Lokasi</label>
            <input type="text" value={editBasic.location || ""} onChange={e => setEditBasic({ ...editBasic, location: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium" />
          </div>
        </div>
      </Modal>

      <Modal title="Ubah Tentang Saya" isOpen={activeModal === 'editAbout'} onClose={() => setActiveModal(null)} onSave={() => saveProfile({ ...profile, about: editAbout })}>
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Deskripsi Diri</label>
          <textarea rows={5} value={editAbout} onChange={e => setEditAbout(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"></textarea>
        </div>
      </Modal>

      <Modal title={editIndex !== null ? "Ubah Pengalaman Kerja" : "Tambah Pengalaman Kerja"} isOpen={activeModal === 'Work'} onClose={() => setActiveModal(null)} onSave={() => handleSaveItem('experiences', editExp)}>
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Posisi/Jabatan</label><input type="text" value={editExp.title || ""} onChange={e => setEditExp({ ...editExp, title: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Perusahaan</label><input type="text" value={editExp.company || ""} onChange={e => setEditExp({ ...editExp, company: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Periode Waktu</label><input type="text" value={editExp.period || ""} onChange={e => setEditExp({ ...editExp, period: e.target.value })} placeholder="Contoh: Jan 2026 - Apr 2026" className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
        </div>
      </Modal>

      <Modal title={editIndex !== null ? "Ubah Pendidikan" : "Tambah Pendidikan"} isOpen={activeModal === 'Education'} onClose={() => setActiveModal(null)} onSave={() => handleSaveItem('education', editEdu)}>
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Instansi Pendidikan</label><input type="text" value={editEdu.school || ""} onChange={e => setEditEdu({ ...editEdu, school: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Gelar / Jurusan</label><input type="text" value={editEdu.degree || ""} onChange={e => setEditEdu({ ...editEdu, degree: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Periode Waktu</label><input type="text" value={editEdu.period || ""} onChange={e => setEditEdu({ ...editEdu, period: e.target.value })} placeholder="Contoh: 2022 - 2026" className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
        </div>
      </Modal>

      <Modal title="Ubah Skills" isOpen={activeModal === 'editSkills'} onClose={() => setActiveModal(null)} onSave={() => saveProfile({ ...profile, skills: editSkills })}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tambahkan Skill</label>
            <input
              type="text"
              placeholder="Ketik lalu tekan Enter..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && skillInput.trim()) {
                  e.preventDefault();
                  if (!editSkills.includes(skillInput.trim())) setEditSkills([...editSkills, skillInput.trim()]);
                  setSkillInput('');
                }
              }}
              className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {editSkills.map((sk, idx) => (
              <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold">
                {sk}
                <button onClick={() => setEditSkills(editSkills.filter((_, i) => i !== idx))} className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>
      </Modal>

      <Modal title="Ubah Bidang Minat" isOpen={activeModal === 'editInterests'} onClose={() => { setActiveModal(null); setInterestInput(''); }} onSave={() => saveProfile({ ...profile, interests: editInterests })}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tambahkan Bidang Minat (Maks 15)</label>
            <input
              type="text"
              placeholder="Ketik lalu tekan Enter..."
              value={interestInput}
              onChange={(e) => setInterestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && interestInput.trim()) {
                  e.preventDefault();
                  if (editInterests.length < 15 && !editInterests.includes(interestInput.trim())) {
                    setEditInterests([...editInterests, interestInput.trim()]);
                  }
                  setInterestInput('');
                }
              }}
              disabled={editInterests.length >= 15}
              className="w-full px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{editInterests.length}/15 Bidang Minat</p>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {editInterests.map((interest, idx) => (
              <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold">
                {interest}
                <button onClick={() => setEditInterests(editInterests.filter((_, i) => i !== idx))} className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900 rounded-full transition-colors"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        </div>
      </Modal>

      <Modal
        title={editPortSocial.index !== null ? "Ubah Portofolio / Sosmed / CV" : "Tambah Portofolio / Sosmed / CV"}
        isOpen={activeModal === 'PortSocial'}
        onClose={() => { setActiveModal(null); setSelectedCvFile(null); }}
        onSave={handleSavePortSocial}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tipe Kategori</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setEditPortSocial((prev: any) => ({ ...prev, category: 'portfolio' }))}
                className={`py-2 px-1 text-xs font-bold rounded-lg transition-all ${editPortSocial.category === 'portfolio' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Portofolio
              </button>
              <button
                type="button"
                onClick={() => setEditPortSocial((prev: any) => ({ ...prev, category: 'social' }))}
                className={`py-2 px-1 text-xs font-bold rounded-lg transition-all ${editPortSocial.category === 'social' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                Sosmed
              </button>
              <button
                type="button"
                onClick={() => setEditPortSocial((prev: any) => ({ ...prev, category: 'cv' }))}
                className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${editPortSocial.category === 'cv' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                <Lock className="w-3 h-3" /> File CV
              </button>
            </div>
          </div>

          {editPortSocial.category === 'cv' ? (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Dokumen CV *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: CV Software Engineer 2026.pdf"
                  value={editPortSocial.title || ""}
                  onChange={e => setEditPortSocial((prev: any) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  File CV (PDF / DOC / DOCX / Image) *
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center hover:border-blue-500 transition-colors bg-slate-50/80 dark:bg-slate-800/80">
                  <input
                    type="file"
                    id="cv-file-input"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedCvFile(file);
                        if (!editPortSocial.title) {
                          setEditPortSocial((prev: any) => ({ ...prev, title: file.name }));
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="cv-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                    <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      {selectedCvFile ? selectedCvFile.name : (editPortSocial.filename || "Klik untuk memilih file CV")}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      🔒 File CV tersimpan dengan enkripsi AES-256 pada database website.
                    </span>
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {editPortSocial.category === 'portfolio' ? 'Judul Portofolio / Website *' : 'Platform / Nama Sosmed *'}
                </label>
                <input
                  type="text"
                  placeholder={editPortSocial.category === 'portfolio' ? "Contoh: fachri-aer.vercel.app" : "Contoh: LinkedIn, GitHub, Resume PDF"}
                  value={editPortSocial.title || ""}
                  onChange={e => setEditPortSocial((prev: any) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Link URL *</label>
                <input
                  type="text"
                  placeholder="Contoh: https://github.com/username"
                  value={editPortSocial.url || ""}
                  onChange={e => setEditPortSocial((prev: any) => ({ ...prev, url: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium"
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      <Modal title={editIndex !== null ? "Ubah Sertifikat" : "Tambah Sertifikat"} isOpen={activeModal === 'Certificate'} onClose={() => setActiveModal(null)} onSave={() => handleSaveItem('certificates', editCert)}>
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Judul Sertifikat</label><input type="text" value={editCert.title || ""} onChange={e => setEditCert({ ...editCert, title: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Penerbit</label><input type="text" value={editCert.issuer || ""} onChange={e => setEditCert({ ...editCert, issuer: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Periode Waktu</label><input type="text" value={editCert.period || ""} onChange={e => setEditCert({ ...editCert, period: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
        </div>
      </Modal>

      <Modal title={editIndex !== null ? "Ubah Pengalaman Organisasi" : "Tambah Pengalaman Organisasi"} isOpen={activeModal === 'Volunteer'} onClose={() => setActiveModal(null)} onSave={() => handleSaveItem('volunteering', editVol)}>
        <div className="space-y-4">
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nama Organisasi</label><input type="text" value={editVol.organization || ""} onChange={e => setEditVol({ ...editVol, organization: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Peran / Jabatan</label><input type="text" value={editVol.role || ""} onChange={e => setEditVol({ ...editVol, role: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
          <div><label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Periode Waktu</label><input type="text" value={editVol.period || ""} onChange={e => setEditVol({ ...editVol, period: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200/80 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-sm font-medium" /></div>
        </div>
      </Modal>

    </div>
  );
}
