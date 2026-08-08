# Walkthrough: Security Hardening — JobTracker by FAR

## Ringkasan
Berdasarkan laporan UAT keamanan OWASP Top 10, dilakukan perbaikan terhadap **15 dari 16 temuan** keamanan. Satu temuan (SEC-007: migrasi ke HttpOnly cookie) ditangguhkan karena merupakan breaking change yang memerlukan refactor lebih luas.

---

## File yang Diubah

### 1. [.gitignore](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/.gitignore)
- **SEC-001:** Menambahkan `client_secret_*.json`, `*.pem`, `*.key` ke daftar ignore

### 2. [.env](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/.env)
- **SEC-002:** Rename `VITE_GOOGLE_CLIENT_SECRET` → `GOOGLE_CLIENT_SECRET` (tidak lagi ter-embed ke browser)

### 3. [.env.example](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/.env.example)
- **SEC-002:** Sinkronisasi rename variabel

### 4. [vite.config.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/vite.config.ts)
- **SEC-015:** Hapus `CLOUDINARY_` dari `envPrefix` — API key/secret tidak lagi ter-embed ke client bundle

### 5. [server.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/server.ts)
| Temuan | Perbaikan |
|--------|-----------|
| SEC-003 | Ditambahkan `express-rate-limit`: `authLimiter` (15 req/15 menit) pada login/register/google, `generalLimiter` (100 req/menit) pada semua /api/ |
| SEC-004 | Ditambahkan `helmet` middleware dengan CSP dinonaktifkan untuk kompatibilitas SPA |
| SEC-005 | PBKDF2 iterasi dinaikkan dari 1,000 → **600,000**; `verifyPassword()` menggunakan `crypto.timingSafeEqual()` |
| SEC-006 | Ditambahkan `sanitizeString()`, `isValidEmail()`, password length validation (8-128 char), dan allowlisted fields pada job create/update |
| SEC-009 | `express.json({ limit: '1mb' })`; multer limits: image 2MB, CV 10MB |
| SEC-010 | Ditambahkan `tokenCreatedAt` ke user schema; auth middleware memvalidasi TTL 7 hari |
| SEC-011 | Ditambahkan warning log saat `CV_ENCRYPTION_KEY` tidak di-set |
| SEC-012 | Error message ke client digeneralisasi (tidak lagi mengekspos `err.message` internal) |
| SEC-014 | File upload di-restrict: image (jpeg/png/webp/gif), CV (pdf/word) |

### 6. [ProfileView.tsx](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/src/components/ProfileView.tsx)
- **SEC-008:** Ditambahkan `esc()` HTML entity escape function; semua interpolasi data profil di innerHTML template sudah di-sanitasi

### 7. [index.html](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/index.html)
- **SEC-013:** Ditambahkan `<title>` dan `<meta name="description">` tag

---

## Package Baru
- `helmet` — HTTP security headers
- `express-rate-limit` — Rate limiting middleware
- `@types/helmet` — TypeScript types

## Verifikasi
- ✅ `npx tsc --noEmit` — 0 errors
- ✅ `npx vite build` — Build sukses (15.23s)
- ✅ `npm audit` — 0 vulnerabilities

## Skor Keamanan Baru (Estimasi)
**Sebelum:** 6.0/10.0 → **Sesudah:** ~8.5/10.0

> **Catatan:** SEC-007 (migrasi token ke HttpOnly cookie) tidak dilakukan dalam sesi ini karena memerlukan refactor pada seluruh flow autentikasi client-side. Direkomendasikan untuk sprint berikutnya.
