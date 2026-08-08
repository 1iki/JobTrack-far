# 💼 JobTracker by FAR

**JobTracker by FAR** adalah aplikasi manajemen pelacakan lamaran kerja (job application tracker) dan hub portofolio profesional berbasis web. Aplikasi ini membantu pencari kerja mengorganisir riwayat lamaran, membuat pengingat jadwal interview, mengelola profil profesional, dan mengunduh CV secara terstruktur.

# Preview Website
** https://jobtracker-far.vercel.app/

---

## ✨ Fitur Utama

- **📊 Dashboard & Analytics**: Visualisasi statistik lamaran kerja (Total Lamaran, Interview, Offered, Rejected) serta grafik tren dan persentase sukses.
- **💼 Manajemen Lamaran Kerja**: Lacak posisi pekerjaan, nama perusahaan, platform pencari kerja, status lamaran, tanggal pendaftaran, dan ekspektasi gaji.
- **⏰ Pengingat & Jadwal (Reminders)**: Catat dan atur tenggat waktu interview, tes teknis, atau follow-up dengan status terselesaikan.
- **👤 Profil & Portofolio Profesional**: Atur pengalaman kerja, pendidikan, keahlian (skills), portofolio, media sosial, serta sertifikat.
- **📄 Generator CV & Ekspor PDF**: Buat CV dari data profil profesional dan ekspor langsung ke dokumen PDF siap pakai.
- **🌓 Mode Tema Otomatis & Kustom**: Mendukung mode Gelap (Dark), Terang (Light), serta pengikutan otomatis tema perangkat.
- **🔐 Sistem Autentikasi Pengguna**: Login & Pendaftaran akun pengguna serta integrasi Google Sign-In.

---

## 🛠️ Teknologi yang Digunakan

- **Frontend**: React 19, TypeScript, TailwindCSS v4, Lucide Icons, Framer Motion, Recharts
- **Backend**: Node.js, Express.js, Multer
- **Database**: MongoDB (Mongoose)
- **Bundler & Build Tool**: Vite, ESBuild, TSX

---

## 🚀 Panduan Memulai (Getting Started)

### Prasyarat
- Node.js (versi 18+)
- npm / yarn / bun

### Langkah Instalasi

1. **Clone repository:**
   ```bash
   git clone https://github.com/1iki/JobTrack-far.git
   cd JobTrack-far
   ```

2. **Install dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Buat file `.env` di direktori utama berdasarkan `.env.example`:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

4. **Jalankan Mode Pengembang (Development):**
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

5. **Build untuk Produksi:**
   ```bash
   npm run build
   npm start
   ```

---

## 📄 Lisensi

Hak Cipta © 2026 **JobTracker by FAR**. Seluruh hak cipta dilindungi undang-undang.
