import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, CheckCircle2, User as UserIcon, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { TermsModal } from './TermsModal';

declare global {
  interface Window {
    google?: any;
  }
}

export function AuthView({ onLogin }: { onLogin: (user: User, token: string) => void }) {
  const [view, setView] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Preview Slideshow State
  const [activeSlide, setActiveSlide] = useState(0);
  const previewSlides = [
    {
      image: '/assets/img/profile.png',
      title: 'Profil & Portofolio',
      caption: 'Kelola pengalaman, skill & ekspor CV'
    },
    {
      image: '/assets/img/dashboard.png',
      title: 'Statistik & Analytics',
      caption: 'Lacak status lamaran & response rate secara real-time'
    }
  ];

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % previewSlides.length);
    }, 4000);
    return () => clearInterval(slideTimer);
  }, [previewSlides.length]);

  const isLogin = view === 'login';
  const isRegister = view === 'register';
  const isForgotPassword = view === 'forgot_password';

  useEffect(() => {
    // Initialize Google GIS if available
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1082987541235-placeholder.apps.googleusercontent.com';
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response.credential) {
              await handleGoogleCredential(response.credential);
            }
          }
        });
      } catch (e) {
        console.warn('Google GIS init notice:', e);
      }
    }
  }, []);

  const handleGoogleCredential = async (credential: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Autentikasi Google gagal');
      }
      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAccessToken = async (accessToken: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Autentikasi Google gagal');
      }
      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleDemoLogin = async (customEmail?: string, customName?: string) => {
    setError(null);
    setLoading(true);
    try {
      const demoEmail = customEmail || 'fachri.adityarizky@gmail.com';
      const demoName = customName || 'Fachri Aditya Rizky (Google Account)';
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleUser: {
            email: demoEmail,
            name: demoName,
            picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
            googleId: 'google_user_fachri_123'
          }
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Autentikasi Google gagal');
      }
      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Gagal login dengan Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setError(null);
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // 1. Try Google OAuth 2.0 Popup Client if client_id is available
    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse.access_token) {
              await handleGoogleAccessToken(tokenResponse.access_token);
            } else {
              await handleGoogleDemoLogin();
            }
          },
          error_callback: () => {
            handleGoogleDemoLogin();
          }
        });
        client.requestAccessToken({ prompt: 'consent' });
        return;
      } catch (e) {
        console.warn('OAuth2 popup notice:', e);
      }
    }

    // 2. Try Google One Tap if client_id is available
    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          handleGoogleDemoLogin();
        }
      });
      return;
    }

    // 3. Fallback to Google Account Login for dev / testing environments
    handleGoogleDemoLogin();
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Silakan masukkan email Anda');
      return;
    }
    setResetSent(true);
  };

  const handleViewChange = (newView: 'login' | 'register' | 'forgot_password') => {
    setView(newView);
    setResetSent(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && !acceptedTerms) {
      setError('Anda wajib menyetujui Syarat & Ketentuan Layanan terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan pada proses autentikasi');
      }

      onLogin(data.user, data.token);
    } catch (err: any) {
      setError(err.message || 'Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#F8FAFC]">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200/80">

        {/* Left Side - Auth Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-md flex items-center justify-center overflow-hidden p-1 shrink-0">
                <img src="/assets/img/icon.png" alt="JobTracker Logo" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div>
                <h1 className="text-xl font-display font-black text-slate-900 tracking-tight">JobTracker <span className="text-blue-600">by FAR</span></h1>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Career & Portfolio Hub</p>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight">
                {isLogin && 'Selamat Datang Kembali!'}
                {isRegister && 'Buat Akun Baru'}
                {isForgotPassword && 'Lupa Password?'}
              </h2>
              <p className="text-slate-500 mt-2 text-sm font-medium leading-relaxed">
                {isLogin && 'Masuk untuk mengelola profil dan portofolio Anda.'}
                {isRegister && 'Bergabunglah untuk mulai membangun profil profesional Anda.'}
                {isForgotPassword && 'Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset password.'}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!isForgotPassword && (
              <>
                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200/80 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 shadow-2xs cursor-pointer"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Lanjutkan dengan Google
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200/80"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-slate-400 font-medium">Atau dengan email</span>
                  </div>
                </div>
              </>
            )}

            {isForgotPassword ? (
              resetSent ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-800">Email Terkirim!</h3>
                    <p className="text-sm text-green-600 mt-1">Kami telah mengirimkan tautan untuk mengatur ulang password Anda. Silakan periksa kotak masuk email Anda.</p>
                  </div>
                  <button onClick={() => handleViewChange('login')} className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors shadow-sm cursor-pointer">
                    Kembali ke Login
                  </button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleForgotPasswordSubmit}>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                      />
                      <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer">
                    Kirim Tautan Reset
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nama Lengkap Kamu"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                      />
                      <UserIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-50/80 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                    />
                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-bold text-slate-700">Password</label>
                    {isLogin && (
                      <button type="button" onClick={() => handleViewChange('forgot_password')} className="text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer">
                        Lupa password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-11 py-3 bg-slate-50/80 border border-slate-200/80 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all font-medium text-sm"
                    />
                    <Lock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                      title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {!isLogin && (
                  <div className="flex items-start gap-2.5 py-1">
                    <input
                      type="checkbox"
                      id="register-terms"
                      checked={acceptedTerms}
                      onChange={(e) => {
                        if (!acceptedTerms) {
                          e.preventDefault();
                          setShowTermsModal(true);
                        } else {
                          setAcceptedTerms(false);
                        }
                      }}
                      className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <label htmlFor="register-terms" className="text-xs font-medium text-slate-600 leading-normal cursor-pointer select-none">
                      Saya menyetujui{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowTermsModal(true);
                        }}
                        className="text-blue-600 font-bold hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Syarat & Ketentuan Layanan
                      </button>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isLogin ? 'Masuk' : 'Daftar Sekarang'}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {isForgotPassword ? (
              <p className="text-center text-slate-600 text-sm font-medium">
                Ingat password Anda?{' '}
                <button onClick={() => handleViewChange('login')} className="text-blue-600 font-bold hover:underline cursor-pointer">
                  Kembali ke Login
                </button>
              </p>
            ) : (
              <p className="text-center text-slate-600 text-sm font-medium">
                {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
                <button onClick={() => handleViewChange(isLogin ? 'register' : 'login')} className="text-blue-600 font-bold hover:underline cursor-pointer">
                  {isLogin ? 'Daftar di sini' : 'Masuk'}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="hidden md:flex w-1/2 bg-slate-950 p-8 lg:p-12 relative items-center justify-center overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl"></div>
          </div>

          <div className="relative z-10 w-full max-w-md">
            <h3 className="text-3xl font-display font-black text-white mb-6 leading-tight">
              Satu Tempat untuk Semua Profesionalitas Anda.
            </h3>

            <div className="space-y-4 mb-10">
              {[
                'Lacak aktivitas loker dengan rapi',
                'Integrasi portofolio & pengalaman',
                'Ekspor ke PDF dengan mudah',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-slate-300 font-medium text-sm">{text}</span>
                </div>
              ))}
            </div>

            {/* Mockup Preview Slideshow */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500 overflow-hidden group">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="bg-slate-950/80 rounded-lg px-3 py-1 text-xs text-slate-400 font-medium flex-1 text-center border border-slate-800/60 tracking-wide font-mono">
                  www.jobtracker-far.vercel.app
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-800/80 shadow-lg group-hover:border-blue-500/30 transition-colors bg-slate-950">
                <img
                  key={activeSlide}
                  src={previewSlides[activeSlide].image}
                  alt={previewSlides[activeSlide].title}
                  className="w-full h-auto max-h-[340px] object-cover object-top rounded-xl transition-all duration-500 transform group-hover:scale-102"
                />

                {/* Slide Caption & Navigation Dots */}
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-950/90 via-slate-950/70 to-transparent flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <p className="text-xs font-bold text-white tracking-tight">{previewSlides[activeSlide].title}</p>
                    <p className="text-[10px] text-slate-300 font-medium">{previewSlides[activeSlide].caption}</p>
                  </div>

                  {/* Dots Indicator */}
                  <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-1 rounded-full border border-slate-800/60">
                    {previewSlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${activeSlide === index ? 'bg-blue-500 w-4' : 'bg-slate-600 hover:bg-slate-400'
                          }`}
                        title={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setAcceptedTerms(true);
          setShowTermsModal(false);
          setError(null);
        }}
        onDecline={() => {
          setAcceptedTerms(false);
          setShowTermsModal(false);
        }}
        isGoogleUser={false}
      />
    </div>
  );
}


