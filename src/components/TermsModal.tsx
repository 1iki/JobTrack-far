import React, { useState, useRef } from 'react';
import { ShieldCheck, ScrollText, AlertTriangle, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TermsModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onAccept: () => void;
  onDecline: () => void;
  isGoogleUser?: boolean;
}

export function TermsModal({ isOpen, onClose, onAccept, onDecline, isGoogleUser = false }: TermsModalProps) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 30;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleDeclineClick = () => {
    setShowDeclineConfirm(true);
  };

  const confirmDecline = () => {
    setShowDeclineConfirm(false);
    onDecline();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="p-5 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/50 dark:to-slate-800/30">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-display font-black text-slate-900 dark:text-white tracking-tight">
                Syarat & Ketentuan Layanan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                JobTracker by FAR &bull; Harap baca dan scroll hingga bagian paling bawah
              </p>
            </div>
          </div>

          {/* Scrollable Terms Content */}
          <div
            ref={contentRef}
            onScroll={handleScroll}
            className="p-5 md:p-6 overflow-y-auto space-y-5 text-sm text-slate-600 dark:text-slate-300 font-normal leading-relaxed flex-1 max-h-[50vh] scrollbar-thin select-text"
          >
            <div className="bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 p-4 rounded-2xl flex items-start gap-3 text-xs text-blue-800 dark:text-blue-300">
              <ScrollText className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong>Ketentuan Penting Penggunaan Layanan:</strong> Untuk melanjutkan penggunaan JobTracker by FAR, Anda diwajibkan untuk membaca dan menyetujui seluruh ketentuan berikut. Tombol <span className="font-bold underline">Saya Setuju</span> akan aktif secara otomatis setelah Anda menyelesaikan scroll dokumen ke paling bawah.
              </div>
            </div>

            <section className="space-y-2">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">1. Ketentuan Umum & Penerimaan Layanan</h3>
              <p>
                Selamat datang di <strong>JobTracker by FAR</strong>. Dengan membuat akun, mengakses, atau menggunakan layanan ini (baik melalui login email maupun Google OAuth), Anda menyatakan telah membaca, memahami, dan menyetujui untuk terikat oleh seluruh Syarat dan Ketentuan Layanan ini. Jika Anda tidak menyetujui syarat ini, Anda tidak diperkenankan menggunakan platform ini.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">2. Pendaftaran Akun & Keamanan Akses</h3>
              <p>
                Pengguna bertanggung jawab penuh atas kerahasiaan informasi akun, termasuk password dan token autentikasi. Pengguna wajib memberikan informasi yang akurat dan terkini saat pendaftaran. Dilarang keras menggunakan identitas palsu atau akun milik orang lain tanpa izin sah.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">3. Pengumpulan Data & Privasi Terenkripsi (AES-256)</h3>
              <p>
                Kami menghargai privasi data Anda. Seluruh dokumen Curriculum Vitae (CV) dan resume yang diunggah ke JobTracker disimpankan secara aman pada database menggunakan standar enkripsi <strong>AES-256</strong>. Kami tidak akan menjual, membagikan, atau menyalahgunakan data pribadi Anda kepada pihak ketiga mana pun tanpa persetujuan eksplisit dari Anda.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">4. Penggunaan Layanan & Integritas Data</h3>
              <p>
                Platform ini disediakan untuk membantu pencari kerja dalam mengelola riwayat pelamaran, statistik karier, pengingat jadwal, dan portofolio profesional. Pengguna dilarang memanfaatkan platform untuk aktivitas ilegal, spamming, pengunggahan virus/malware, atau aktivitas yang dapat merusak integritas server.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">5. Integrasi Autentikasi Google OAuth</h3>
              <p>
                Bagi pengguna yang masuk menggunakan Google OAuth, informasi profil dasar (nama, email, foto profil) digunakan untuk memverifikasi identitas dan membuat sesi akun. Jika pengguna Google OAuth menolak Syarat & Ketentuan ini, akun yang baru dibuat akan dihapus secara otomatis dan sesi login akan segera diakhiri.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">6. Pembatalan, Penolakan & Penghapusan Akun</h3>
              <p>
                Pengguna berhak mengajukan penghapusan akun kapan saja. Apabila pengguna menolak Syarat & Ketentuan ini saat pertama kali mendaftar atau masuk via Google OAuth, akun pengguna akan langsung dihapus secara otomatis dari basis data tanpa menyimpan riwayat apa pun.
              </p>
            </section>

            <section className="space-y-2 pb-4">
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">7. Perubahan Ketentuan Layanan</h3>
              <p>
                JobTracker by FAR berhak untuk memperbarui Syarat & Ketentuan Layanan ini sewaktu-waktu. Perubahan akan berlaku secara langsung setelah diperbarui pada platform. Penggunaan berlanjut atas layanan kami merupakan bentuk persetujuan Anda terhadap perubahan tersebut.
              </p>
              <div className="pt-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                &mdash; Akhir Dokumen Syarat & Ketentuan Layanan &mdash;
              </div>
            </section>
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              {!hasScrolledToBottom ? (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold animate-pulse">
                  <ArrowDown className="w-4 h-4" /> Scroll sampai bawah untuk menyetujui
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" /> Dokumen telah dibaca sampai selesai
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDeclineClick}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs transition-all cursor-pointer"
              >
                Tolak
              </button>
              <button
                type="button"
                disabled={!hasScrolledToBottom}
                onClick={onAccept}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Saya Setuju
              </button>
            </div>
          </div>
        </motion.div>

        {/* Decline Confirmation Alert Dialog */}
        {showDeclineConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-md w-full border border-red-200 dark:border-red-950 shadow-2xl space-y-4 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-display font-black text-slate-900 dark:text-white">
                Konfirmasi Penolakan Ketentuan
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                {isGoogleUser
                  ? "Karena Anda menolak Syarat & Ketentuan Layanan, akun Google yang baru dibuat akan dihapus secara otomatis dan Anda akan di-logout dari sistem."
                  : "Anda tidak dapat membuat akun baru tanpa menyetujui Syarat & Ketentuan Layanan."}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeclineConfirm(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Kembali ke Dokumen
                </button>
                <button
                  type="button"
                  onClick={confirmDecline}
                  className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow-md shadow-red-600/20"
                >
                  Ya, Menolak
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
}
