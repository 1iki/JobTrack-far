import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export function AuthView({ onLogin }: { onLogin: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-slate-50">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* Left Side - Auth Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                {isLogin ? 'Selamat Datang Kembali!' : 'Buat Akun Baru'}
              </h2>
              <p className="text-slate-500 mt-2 text-sm font-medium">
                {isLogin ? 'Masuk untuk mengelola profil dan portofolio Anda.' : 'Bergabunglah untuk mulai membangun profil profesional Anda.'}
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
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
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400 font-medium">Atau dengan email</span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
              {!isLogin && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                  <div className="relative">
                    <input type="text" placeholder="John Doe" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
                    <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <input type="email" placeholder="nama@email.com" className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
                  <Mail className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-slate-700">Password</label>
                  {isLogin && <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700">Lupa password?</a>}
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all" />
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

              <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                {isLogin ? 'Masuk' : 'Daftar Sekarang'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>

            <p className="text-center text-slate-600 text-sm font-medium">
              {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
              <button onClick={() => setIsLogin(!isLogin)} className="text-blue-600 font-bold hover:underline">
                {isLogin ? 'Daftar di sini' : 'Masuk'}
              </button>
            </p>
          </div>
        </div>

        {/* Right Side - Preview */}
        <div className="hidden md:flex w-1/2 bg-slate-900 p-8 lg:p-12 relative items-center justify-center overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl"></div>
          </div>

          <div className="relative z-10 w-full max-w-md">
            <h3 className="text-3xl font-black text-white mb-6 leading-tight">
              Satu Tempat untuk Semua Profesionalitas Anda.
            </h3>

            <div className="space-y-4 mb-10">
              {[
                'Lacak aktivitas loker dengan rapi',
                'Integrasi portofolio & pengalaman',
                'Ekspor ke PDF dengan mudah',
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-slate-300 font-medium">{text}</span>
                </div>
              ))}
            </div>

            {/* Mockup Preview Slideshow */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-2xl transform rotate-2 hover:rotate-0 transition-all duration-500 overflow-hidden group">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-3">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                </div>
                <div className="bg-slate-900 rounded-md px-3 py-1 text-xs text-slate-400 font-medium flex-1 text-center font-mono">
                  www.jobtracker.vercel.app
                </div>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-slate-700/80 shadow-lg bg-slate-950">
                <img 
                  key={activeSlide}
                  src={previewSlides[activeSlide].image} 
                  alt={previewSlides[activeSlide].title} 
                  className="w-full h-auto max-h-[320px] object-cover object-top rounded-xl transition-all duration-500" 
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
                        className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                          activeSlide === index ? 'bg-blue-500 w-4' : 'bg-slate-600 hover:bg-slate-400'
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
    </div>
  );
}
