# 🛡️ Laporan UAT Keamanan — JobTracker by FAR

**Tanggal Pengujian:** 9 Agustus 2026
**Penguji:** Antigravity Security Code Review
**Metodologi:** OWASP Top 10 (2021) & Secure Software Development Lifecycle (SSDLC)
**Cakupan:** Full-stack (Express.js backend + React frontend)

---

## 📊 Ringkasan Eksekutif

| Severity | Jumlah | Status |
|----------|--------|--------|
| 🔴 **CRITICAL** | 2 | ⚠️ Perlu Segera Diperbaiki |
| 🟠 **HIGH** | 4 | ⚠️ Perlu Diperbaiki |
| 🟡 **MEDIUM** | 5 | ⚡ Direkomendasikan |
| 🔵 **LOW** | 3 | 💡 Peningkatan |
| ⚪ **INFO** | 2 | ✅ Informasi |
| | |
| **Total Temuan** | **16** | |

### ✅ Area yang Sudah Baik
- 0 vulnerabilities pada `npm audit` (dependensi aman)
- Password di-hash menggunakan PBKDF2-SHA512 dengan salt unik
- Token sesi menggunakan `crypto.randomBytes(32)` (256-bit)
- CV terenkripsi dengan AES-256-CBC dan IV unik per file
- `.env` sudah terdaftar di `.gitignore`
- React JSX secara otomatis meng-escape XSS pada output
- Otorisasi data per-user sudah ada (`userId` filter) di semua query MongoDB
- COOP header (`same-origin-allow-popups`) sudah diset

---

## 🔴 CRITICAL — Temuan Kritis

### SEC-001: File Client Secret Google OAuth Terekspos di Repository

| Detail | Nilai |
|--------|-------|
| **OWASP** | A07:2021 — Identification & Authentication Failures |
| **File** | `client_secret_[REDACTED].json` |
| **Severity** | 🔴 CRITICAL |

**Deskripsi:**
File `client_secret_738845442782-...json` berisi credential lengkap Google OAuth (client_id, client_secret, project_id) tersimpan sebagai file terpisah di root project. File ini **TIDAK** terdaftar di `.gitignore`, sehingga akan ter-commit ke Git repository.

> [!CAUTION]
> Jika repository ini pernah di-push ke GitHub/GitLab (publik maupun privat), credential Google OAuth Anda **sudah terekspos** dan harus di-revoke + regenerate di Google Cloud Console.

**Rekomendasi:**
1. Tambahkan `client_secret_*.json` ke `.gitignore`
2. Hapus file dari Git history menggunakan `git filter-repo` atau `BFG Repo Cleaner`
3. Revoke credential lama di Google Cloud Console & generate yang baru
4. Simpan semua secret hanya di `.env` (sudah ada `VITE_GOOGLE_CLIENT_ID` & `VITE_GOOGLE_CLIENT_SECRET`)

---

### SEC-002: Google OAuth Client Secret Terekspos ke Browser (Client-Side)

| Detail | Nilai |
|--------|-------|
| **OWASP** | A07:2021 — Identification & Authentication Failures |
| **File** | [.env](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/.env) (baris 3) |
| **Severity** | 🔴 CRITICAL |

**Deskripsi:**
Variabel `VITE_GOOGLE_CLIENT_SECRET` menggunakan prefix `VITE_`, yang berarti Vite akan meng-embed nilai ini ke dalam JavaScript bundle yang dikirim ke browser. **Google Client Secret adalah server-side credential dan TIDAK BOLEH pernah sampai ke client.**

```
VITE_GOOGLE_CLIENT_SECRET="GOCSPX-[REDACTED]"
```

> [!CAUTION]
> Siapapun yang membuka DevTools > Sources di browser dapat melihat secret ini dari bundled JS.

**Rekomendasi:**
1. Rename menjadi `GOOGLE_CLIENT_SECRET` (tanpa prefix `VITE_`) agar hanya dapat diakses oleh server
2. Gunakan hanya di `server.ts` untuk server-side OAuth verification
3. Revoke & regenerate secret saat ini di Google Cloud Console

---

## 🟠 HIGH — Temuan Tinggi

### SEC-003: Tidak Ada Rate Limiting pada Endpoint Autentikasi

| Detail | Nilai |
|--------|-------|
| **OWASP** | A07:2021 — Identification & Authentication Failures |
| **File** | [server.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/server.ts#L216-L279) |
| **Severity** | 🟠 HIGH |

**Deskripsi:**
Endpoint `/api/auth/login`, `/api/auth/register`, dan `/api/auth/google` tidak memiliki rate limiting. Penyerang dapat melakukan:
- **Brute-force attack** pada password login
- **Credential stuffing** dengan database credential yang bocor
- **Account enumeration** melalui respons error yang berbeda ("Email sudah terdaftar" vs "Email atau password salah")

**Rekomendasi:**
```bash
npm install express-rate-limit
```
```typescript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // maks 10 request per window
  message: { error: 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

---

### SEC-004: Tidak Ada Security Headers (Helmet)

| Detail | Nilai |
|--------|-------|
| **OWASP** | A05:2021 — Security Misconfiguration |
| **File** | [server.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/server.ts#L157-L166) |
| **Severity** | 🟠 HIGH |

**Deskripsi:**
Server tidak menggunakan middleware `helmet` untuk menyetel HTTP security headers. Header yang hilang:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security` (HSTS)
- `X-XSS-Protection`
- `Content-Security-Policy` (CSP)
- `Referrer-Policy`
- `Permissions-Policy`

**Rekomendasi:**
```bash
npm install helmet
```
```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

### SEC-005: Password Hashing Menggunakan Iterasi Rendah (PBKDF2 1000 Iterasi)

| Detail | Nilai |
|--------|-------|
| **OWASP** | A02:2021 — Cryptographic Failures |
| **File** | [server.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/server.ts#L46-L57) |
| **Severity** | 🟠 HIGH |

**Deskripsi:**
Fungsi `hashPassword()` menggunakan PBKDF2 dengan hanya **1,000 iterasi**. Standar OWASP merekomendasikan minimal **600,000 iterasi** untuk PBKDF2-SHA512 (per 2023). Dengan GPU modern, 1,000 iterasi dapat di-brute-force dalam hitungan detik.

```typescript
// SAAT INI (LEMAH):
const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512');

// REKOMENDASI (KUAT):
const hash = crypto.pbkdf2Sync(password, salt, 600000, 64, 'sha512');
```

**Tambahan:** Perbandingan hash di `verifyPassword()` menggunakan operator `===` yang rentan terhadap **timing attack**:
```typescript
// SAAT INI (RENTAN):
return hash === verifyHash;

// REKOMENDASI (AMAN):
return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
```

---

### SEC-006: Tidak Ada Validasi/Sanitasi Input pada API

| Detail | Nilai |
|--------|-------|
| **OWASP** | A03:2021 — Injection |
| **File** | [server.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/server.ts#L439-L444) |
| **Severity** | 🟠 HIGH |

**Deskripsi:**
Beberapa endpoint API menerima `req.body` langsung tanpa validasi:

```typescript
// Job creation — menerima APAPUN dari client
const job = await Job.create({ ...req.body, userId: req.user._id.toString() });

// Profile update — hanya menghapus _id/id, selebihnya langsung masuk DB
const updateData = { ...req.body };
delete updateData._id;
delete updateData.id;
await Profile.updateOne({ userId: req.user._id.toString() }, { $set: updateData });
```

Risiko:
- **NoSQL Injection** via MongoDB operator (`$gt`, `$regex`, `$where`)
- **Prototype Pollution** via `__proto__` atau `constructor`
- **Schema Poisoning** — menambah field tak terduga ke database

**Rekomendasi:**
1. Install library validasi: `npm install zod` atau `express-validator`
2. Definisikan schema validasi eksplisit untuk setiap endpoint
3. Filter field yang diizinkan (allowlist) bukan yang dilarang (denylist)

```typescript
import { z } from 'zod';

const jobSchema = z.object({
  title: z.string().max(200),
  company: z.string().max(200),
  platform: z.string().max(100).optional(),
  status: z.enum(['Applied', 'Interview', 'Offered', 'Rejected', 'Pending']),
  // ... field lainnya
});

app.post('/api/jobs', authenticateUser, async (req, res) => {
  const parsed = jobSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });
  const job = await Job.create({ ...parsed.data, userId: req.user._id.toString() });
  res.json(job);
});
```

---

## 🟡 MEDIUM — Temuan Sedang

### SEC-007: Token Autentikasi Disimpan di localStorage (Rentan XSS)

| Detail | Nilai |
|--------|-------|
| **OWASP** | A07:2021 — Identification & Authentication Failures |
| **File** | [store.tsx](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/src/store.tsx#L134) |
| **Severity** | 🟡 MEDIUM |

**Deskripsi:**
Token sesi disimpan di `localStorage` (`jobtrack_auth_token`). Jika ada kerentanan XSS di aplikasi, penyerang dapat mencuri token via `localStorage.getItem('jobtrack_auth_token')` dari JavaScript apapun yang berjalan di halaman.

**Rekomendasi:**
Gunakan **HttpOnly, Secure, SameSite=Strict cookie** yang tidak dapat diakses JavaScript:
```typescript
res.cookie('session_token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari
});
```

---

### SEC-008: innerHTML Digunakan untuk Generasi PDF tanpa Sanitasi

| Detail | Nilai |
|--------|-------|
| **OWASP** | A03:2021 — Injection (XSS) |
| **File** | [ProfileView.tsx](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/src/components/ProfileView.tsx#L352) |
| **Severity** | 🟡 MEDIUM |

**Deskripsi:**
Fungsi `handleExportPDF()` menggunakan `element.innerHTML` dengan template literal yang menyisipkan data profil pengguna tanpa sanitasi. Meskipun saat ini data hanya berasal dari pengguna yang sama (self-XSS), jika data profil dapat diakses oleh admin atau pengguna lain di masa depan, ini menjadi vektor **Stored XSS**.

```typescript
element.innerHTML = `
  <h1>${profile.name || 'Nama Lengkap'}</h1>
  <p>${profile.about}</p>       // <-- data user langsung masuk HTML
  <p>${exp.company}</p>          // <-- data user langsung masuk HTML
`;
```

**Rekomendasi:**
Buat fungsi helper untuk escape HTML entity:
```typescript
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
```

---

### SEC-009: Tidak Ada Batas Ukuran Body Request (express.json)

| Detail | Nilai |
|--------|-------|
| **OWASP** | A05:2021 — Security Misconfiguration |
| **File** | [server.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/server.ts#L160) |
| **Severity** | 🟡 MEDIUM |

**Deskripsi:**
`express.json()` dipanggil tanpa batas ukuran. Default Express adalah 100KB, tetapi sebaiknya di-set eksplisit dan ditambahkan batas untuk file upload juga.

```typescript
// SAAT INI:
app.use(express.json());

// REKOMENDASI:
app.use(express.json({ limit: '1mb' }));
```

Untuk multer (file upload CV), juga belum ada limit:
```typescript
// SAAT INI:
const upload = multer({ storage });

// REKOMENDASI:
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB maks
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    cb(null, allowed.includes(file.mimetype));
  }
});
```

---

### SEC-010: Token Sesi Tidak Memiliki Expiry

| Detail | Nilai |
|--------|-------|
| **OWASP** | A07:2021 — Identification & Authentication Failures |
| **File** | [server.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/server.ts#L59-L61) |
| **Severity** | 🟡 MEDIUM |

**Deskripsi:**
Token sesi yang di-generate oleh `generateToken()` tidak memiliki TTL (time-to-live). Token akan valid selamanya sampai user login ulang (yang menimpa token lama) atau akun dihapus.

**Rekomendasi:**
Tambahkan field `tokenCreatedAt` di user schema dan validasi umur token:
```typescript
const userSchema = new mongoose.Schema({
  // ...existing fields...
  tokenCreatedAt: { type: Date, default: Date.now }
});

// Di authenticateUser middleware:
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari
if (Date.now() - user.tokenCreatedAt.getTime() > TOKEN_MAX_AGE_MS) {
  return res.status(401).json({ error: 'Sesi telah kadaluarsa' });
}
```

---

### SEC-011: Default Hardcoded CV Encryption Key

| Detail | Nilai |
|--------|-------|
| **OWASP** | A02:2021 — Cryptographic Failures |
| **File** | [server.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/server.ts#L64-L66) |
| **Severity** | 🟡 MEDIUM |

**Deskripsi:**
Jika variabel `CV_ENCRYPTION_KEY` tidak ada di `.env`, sistem menggunakan hardcoded fallback key:

```typescript
const CV_ENCRYPTION_KEY = process.env.CV_ENCRYPTION_KEY
  ? crypto.scryptSync(process.env.CV_ENCRYPTION_KEY, 'cv_salt_2026', 32)
  : crypto.scryptSync('jobtracker_default_cv_secret_key_2026', 'cv_salt_2026', 32);
```

**Rekomendasi:**
Jangan gunakan fallback — gagalkan startup jika key tidak ada:
```typescript
if (!process.env.CV_ENCRYPTION_KEY) {
  throw new Error('FATAL: CV_ENCRYPTION_KEY environment variable is required');
}
const CV_ENCRYPTION_KEY = crypto.scryptSync(process.env.CV_ENCRYPTION_KEY, 'cv_salt_2026', 32);
```

---

## 🔵 LOW — Temuan Rendah

### SEC-012: Error Message Terlalu Detail (Information Leakage)

| Detail | Nilai |
|--------|-------|
| **OWASP** | A05:2021 — Security Misconfiguration |
| **File** | [server.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/server.ts#L377) |
| **Severity** | 🔵 LOW |

**Deskripsi:**
Beberapa error response mengekspos detail internal error message ke client:

```typescript
// Google auth — mengekspos internal error message
res.status(500).json({ error: 'Autentikasi Google gagal: ' + (err?.message || 'Error internal') });

// CV decrypt — mengekspos internal error
res.status(500).json({ error: 'Gagal mendekripsi file CV: ' + (err?.message || 'Error internal') });
```

**Rekomendasi:**
Kirimkan pesan generik ke client, log detail ke server:
```typescript
console.error('Google auth error:', err);
res.status(500).json({ error: 'Autentikasi Google gagal. Silakan coba lagi.' });
```

---

### SEC-013: Tidak Ada `<title>` Tag yang Unik per Halaman

| Detail | Nilai |
|--------|-------|
| **OWASP** | N/A (Best Practice) |
| **File** | [index.html](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/index.html) |
| **Severity** | 🔵 LOW |

**Deskripsi:**
File `index.html` tidak memiliki tag `<title>`. Ini berdampak pada UX dan SEO.

**Rekomendasi:**
```html
<title>JobTracker by FAR — Career & Portfolio Hub</title>
<meta name="description" content="Kelola profil, portofolio, dan lacak lamaran pekerjaan Anda." />
```

---

### SEC-014: Cloudinary Upload Tanpa File Type Restriction

| Detail | Nilai |
|--------|-------|
| **OWASP** | A04:2021 — Insecure Design |
| **File** | [server.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/server.ts#L560-L586) |
| **Severity** | 🔵 LOW |

**Deskripsi:**
Endpoint `/api/upload` menerima file apapun (`resource_type: 'auto'`) tanpa validasi tipe MIME atau ekstensi file di sisi server.

**Rekomendasi:**
Tambahkan fileFilter pada multer dan validasi mimetype:
```typescript
const imageUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Hanya file gambar yang diizinkan'));
  }
});
```

---

## ⚪ INFO — Informasi

### SEC-015: `VITE_` Prefix Mengekspos Variabel ke Client

| Detail | Nilai |
|--------|-------|
| **OWASP** | A05:2021 — Security Misconfiguration |
| **File** | [vite.config.ts](file:///c:/Code/AI%20CODER/AI%20ENGGINEER/jobtracker-by-far/vite.config.ts#L8) |
| **Severity** | ⚪ INFO |

**Deskripsi:**
Config `envPrefix: ['VITE_', 'CLOUDINARY_']` berarti semua variabel `CLOUDINARY_*` juga ter-embed ke client-side bundle. Meskipun `CLOUDINARY_CLOUD_NAME` boleh publik, `CLOUDINARY_API_KEY` dan `CLOUDINARY_API_SECRET` seharusnya hanya di server-side.

**Rekomendasi:**
Hapus `CLOUDINARY_` dari `envPrefix` dan akses hanya di `server.ts` via `process.env`.

---

### SEC-016: Dependency Audit Bersih

| Detail | Nilai |
|--------|-------|
| **OWASP** | A06:2021 — Vulnerable & Outdated Components |
| **Severity** | ⚪ INFO |

**Deskripsi:**
```
npm audit: found 0 vulnerabilities
Total dependencies: 406 (prod: 278, dev: 16, optional: 112)
```
✅ Seluruh dependensi terbebas dari kerentanan yang diketahui pada tanggal pengujian.

---

## 📋 Matriks Kepatuhan OWASP Top 10 (2021)

| # | Kategori OWASP | Status | Temuan Terkait |
|---|----------------|--------|----------------|
| A01 | Broken Access Control | ✅ Baik | userId filter ada di semua query |
| A02 | Cryptographic Failures | ⚠️ Perlu Perbaikan | SEC-005, SEC-011 |
| A03 | Injection | ⚠️ Perlu Perbaikan | SEC-006, SEC-008 |
| A04 | Insecure Design | ⚠️ Minor | SEC-014 |
| A05 | Security Misconfiguration | ⚠️ Perlu Perbaikan | SEC-004, SEC-009, SEC-012, SEC-015 |
| A06 | Vulnerable Components | ✅ Bersih | SEC-016 (0 vuln) |
| A07 | Authentication Failures | 🔴 Kritis | SEC-001, SEC-002, SEC-003, SEC-007, SEC-010 |
| A08 | Software & Data Integrity | ✅ Baik | Tidak ada deserialisasi tak aman |
| A09 | Logging & Monitoring | ⚠️ Minimal | Hanya `console.log/error` |
| A10 | SSRF | ✅ Baik | Tidak ada user-controlled URL fetch |

---

## 🎯 Prioritas Remediasi

### Prioritas 1 — Segera (Hari Ini)
1. **SEC-001** — Hapus file `client_secret_*.json` dari repo & tambahkan ke `.gitignore`
2. **SEC-002** — Rename `VITE_GOOGLE_CLIENT_SECRET` → `GOOGLE_CLIENT_SECRET` & revoke/regenerate

### Prioritas 2 — Minggu Ini
3. **SEC-003** — Implementasi rate limiting (`express-rate-limit`)
4. **SEC-004** — Pasang `helmet` middleware
5. **SEC-005** — Naikkan PBKDF2 iterasi ke 600,000 & gunakan `timingSafeEqual`
6. **SEC-006** — Tambahkan validasi input dengan Zod/express-validator

### Prioritas 3 — Sprint Berikutnya
7. **SEC-007** — Migrasi token ke HttpOnly cookie
8. **SEC-008** — Sanitasi HTML di PDF export
9. **SEC-009** — Set batas ukuran body & file upload
10. **SEC-010** — Implementasi token expiry
11. **SEC-011** — Hapus fallback encryption key

### Prioritas 4 — Backlog
12. **SEC-012** — Kurangi detail error ke client
13. **SEC-013** — Tambahkan `<title>` tag
14. **SEC-014** — Restrict file type pada Cloudinary upload
15. **SEC-015** — Hapus `CLOUDINARY_` dari `envPrefix`

---

## ✅ Kesimpulan

Aplikasi **JobTracker by FAR** memiliki fondasi keamanan yang cukup baik pada level **Access Control (A01)** dan **Dependency Management (A06)**. Namun, ditemukan **2 kerentanan kritis** terkait eksposur credential (SEC-001, SEC-002) yang memerlukan tindakan **segera hari ini**. Area **Authentication (A07)** dan **Security Misconfiguration (A05)** memerlukan perbaikan signifikan dengan menambahkan rate limiting, security headers, dan token expiry.

**Skor Keamanan Keseluruhan: 6.0 / 10.0**

> [!IMPORTANT]
> Prioritas utama adalah menangani SEC-001 dan SEC-002 (credential exposure) karena ini dapat dieksploitasi secara langsung oleh penyerang tanpa akses ke sistem internal.
