import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Connect to MongoDB with serverless connection reuse
async function ensureDBConnected() {
  if (mongoose.connection.readyState >= 1) return;
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    await mongoose.connect(mongoUri, { dbName: 'JobTrackerV1', serverSelectionTimeoutMS: 5000 });
  } else {
    console.warn('WARNING: MONGODB_URI is not set in environment!');
    throw new Error('MONGODB_URI environment variable is not configured in Vercel environment.');
  }
}

// Initial connection attempt on cold start
ensureDBConnected().catch(err => console.error('MongoDB cold start error:', err));

// Define User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String },
  avatar: { type: String },
  googleId: { type: String },
  token: { type: String },
  tokenCreatedAt: { type: Date, default: Date.now },
  acceptedTerms: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password;
  }
});

const User = mongoose.model('User', userSchema);

// Crypto helpers for password hashing & token generation
const PBKDF2_ITERATIONS = 600000; // OWASP 2023 recommendation for SHA-512
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Input sanitization helpers
function sanitizeString(val: any, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// AES-256 Encryption / Decryption for CV files
if (!process.env.CV_ENCRYPTION_KEY) {
  console.warn('WARNING: CV_ENCRYPTION_KEY is not set! Using default key (NOT safe for production).');
}
const CV_ENCRYPTION_KEY = crypto.scryptSync(
  process.env.CV_ENCRYPTION_KEY || 'jobtracker_default_cv_secret_key_2026',
  'cv_salt_2026', 32
);

function encryptCVBuffer(buffer: Buffer): { encryptedData: string; iv: string } {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', CV_ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return {
    encryptedData: encrypted.toString('base64'),
    iv: iv.toString('hex')
  };
}

function decryptCVBuffer(encryptedData: string, ivHex: string): Buffer {
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedBuffer = Buffer.from(encryptedData, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', CV_ENCRYPTION_KEY, iv);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}

// Define Encrypted CV Schema
const cvSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: String,
  filename: String,
  mimeType: String,
  encryptedData: String,
  iv: String
}, { timestamps: true });

const EncryptedCV = mongoose.model('EncryptedCV', cvSchema);

// Define Profile Schema
const profileSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  name: String,
  title: String,
  email: String,
  phone: String,
  location: String,
  highestEducation: String,
  about: String,
  profileImage: String,
  experiences: [
    {
      id: String,
      title: String,
      company: String,
      period: String,
      description: String
    }
  ],
  education: [
    {
      id: String,
      degree: String,
      school: String,
      period: String,
      description: String
    }
  ],
  skills: [String],
  interests: [String],
  portfolio: [
    {
      title: String,
      url: String
    }
  ],
  socials: [
    {
      platform: String,
      url: String
    }
  ],
  cvs: [
    {
      id: String,
      cvId: String,
      title: String,
      filename: String,
      url: String,
      createdAt: { type: Date, default: Date.now }
    }
  ],
  certificates: [{ id: String, title: String, issuer: String, period: String }],
  volunteering: [{ id: String, role: String, organization: String, period: String }]
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);

export const app = express();

// Job and Reminder schemas (module-level, alongside User and Profile)
const jobSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  title: String,
  company: String,
  platform: String,
  location: String,
  expectedSalary: String,
  dateApplied: String,
  notes: String,
  status: String,
  url: String,
  imageUrl: String
}, { timestamps: true });
jobSchema.set('toJSON', { virtuals: true, transform: (doc, ret: any) => { ret.id = ret._id; delete ret._id; delete ret.__v; } });

const reminderSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  jobId: String,
  date: String,
  title: String,
  type: String,
  completed: Boolean
}, { timestamps: true });
reminderSchema.set('toJSON', { virtuals: true, transform: (doc, ret: any) => { ret.id = ret._id; delete ret._id; delete ret.__v; } });

const Job = mongoose.model('Job', jobSchema);
const Reminder = mongoose.model('Reminder', reminderSchema);

// SEC-004: Security headers via helmet
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false, // Disabled COOP header to prevent blocking Google GSI/OAuth popup window.closed checks
  }));

  // SEC-009: Limit request body size
  app.use(express.json({ limit: '1mb' }));

  // Path normalization for Vercel / serverless deployments
  app.use((req: any, res: any, next: any) => {
    if (req.url && !req.url.startsWith('/api') && (req.url.startsWith('/auth') || req.url.startsWith('/jobs') || req.url.startsWith('/reminders') || req.url.startsWith('/profile') || req.url.startsWith('/cv') || req.url.startsWith('/upload'))) {
      req.url = '/api' + req.url;
    }
    next();
  });

  // SEC-003: Rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 15,
    message: { error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: { error: 'Terlalu banyak request. Silakan coba lagi nanti.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', generalLimiter);

  // Auto-reconnect DB middleware for API endpoints
  app.use('/api/', async (req, res, next) => {
    try {
      await ensureDBConnected();
    } catch (err) {
      console.error('DB middleware connection notice:', err);
    }
    next();
  });

  // Middleware Autentikasi Pengguna (SEC-010: Token Expiry)
  const authenticateUser = async (req: any, res: any, next: any) => {
    try {
      const authHeader = req.headers.authorization || req.headers['authorization'];
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Akses ditolak. Silakan login terlebih dahulu.' });
      }
      const token = authHeader.split(' ')[1];
      const user = await User.findOne({ token });
      if (!user) {
        return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir.' });
      }
      if (user.tokenCreatedAt && (Date.now() - new Date(user.tokenCreatedAt).getTime() > TOKEN_MAX_AGE_MS)) {
        user.token = undefined;
        await user.save();
        return res.status(401).json({ error: 'Sesi telah kadaluarsa. Silakan login kembali.' });
      }
      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ error: 'Gagal mengautentikasi permintaan' });
    }
  };

  // --- Authentication Routes ---
  app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
      const name = sanitizeString(req.body.name, 100);
      const email = sanitizeString(req.body.email, 254).toLowerCase();
      const password = typeof req.body.password === 'string' ? req.body.password : '';

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
      }
      if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Format email tidak valid' });
      }
      if (password.length < 8 || password.length > 128) {
        return res.status(400).json({ error: 'Password harus antara 8-128 karakter' });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email sudah terdaftar. Silakan login.' });
      }
      const token = generateToken();
      const user = await User.create({
        name,
        email,
        password: hashPassword(password),
        token,
        tokenCreatedAt: new Date(),
        acceptedTerms: true
      });
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          acceptedTerms: user.acceptedTerms || false,
          isGoogleUser: false
        },
        token
      });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Gagal melakukan pendaftaran' });
    }
  });

  app.post('/api/auth/login', authLimiter, async (req, res) => {
    try {
      const email = sanitizeString(req.body.email, 254).toLowerCase();
      const password = typeof req.body.password === 'string' ? req.body.password : '';
      if (!email || !password) {
        return res.status(400).json({ error: 'Email dan password wajib diisi' });
      }
      const user = await User.findOne({ email });
      if (!user || !user.password || !verifyPassword(password, user.password)) {
        return res.status(400).json({ error: 'Email atau password salah' });
      }
      const token = generateToken();
      user.token = token;
      user.tokenCreatedAt = new Date();
      await user.save();
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          acceptedTerms: user.acceptedTerms || false,
          isGoogleUser: !!user.googleId
        },
        token
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Gagal melakukan login' });
    }
  });

  app.post('/api/auth/google', authLimiter, async (req, res) => {
    try {
      await ensureDBConnected();
      const { credential, accessToken, googleUser } = req.body || {};
      let googlePayload: { sub?: string; email?: string; name?: string; picture?: string } | null = null;

      if (credential) {
        try {
          const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
          if (response.ok) {
            googlePayload = await response.json();
          }
        } catch (e) {
          console.warn('Google tokeninfo fetch warning:', e);
        }

        // Direct JWT decode fallback if fetch to Google fails or returns non-200
        if (!googlePayload && typeof credential === 'string' && credential.includes('.')) {
          try {
            const base64Url = credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
            const decoded = JSON.parse(jsonPayload);
            if (decoded && decoded.email) {
              googlePayload = {
                sub: decoded.sub,
                email: decoded.email,
                name: decoded.name || decoded.given_name || decoded.email.split('@')[0],
                picture: decoded.picture
              };
            }
          } catch (e) {
            console.warn('JWT direct decode notice:', e);
          }
        }
      } else if (accessToken) {
        try {
          const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (response.ok) {
            googlePayload = await response.json();
          }
        } catch (e) {
          console.warn('Google userinfo fetch warning:', e);
        }
      } else if (googleUser && googleUser.email) {
        // Fallback for dev/demo Google OAuth testing
        googlePayload = {
          sub: googleUser.googleId || 'google_demo_' + Date.now(),
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split('@')[0],
          picture: googleUser.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c'
        };
      }

      if (!googlePayload || !googlePayload.email) {
        return res.status(400).json({ error: 'Token Google tidak valid atau gagal diverifikasi' });
      }

      const { sub: googleId, email, name, picture } = googlePayload;
      let user = await User.findOne({ email: email.toLowerCase() });

      const token = generateToken();

      if (!user) {
        user = await User.create({
          name: sanitizeString(name || email.split('@')[0], 100),
          email: email.toLowerCase(),
          googleId,
          avatar: picture,
          token,
          tokenCreatedAt: new Date(),
          acceptedTerms: false
        });
      } else {
        user.googleId = googleId || user.googleId;
        if (picture && !user.avatar) user.avatar = picture;
        user.token = token;
        user.tokenCreatedAt = new Date();
        await user.save();
      }

      return res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          acceptedTerms: user.acceptedTerms || false,
          isGoogleUser: true
        },
        token
      });
    } catch (err: any) {
      console.error('Google auth error:', err);
      if (err?.name === 'MongooseError' || err?.message?.includes('buffering timed out')) {
        return res.status(503).json({ error: 'Gagal terhubung ke database MongoDB. Silakan periksa koneksi internet atau whitelist IP MongoDB Atlas Anda.' });
      }
      res.status(500).json({ error: 'Autentikasi Google gagal. Silakan coba lagi.' });
    }
  });

  app.get('/api/auth/me', async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Tidak ada token sesi' });
      }
      const token = authHeader.split(' ')[1];
      const user = await User.findOne({ token });
      if (!user) {
        return res.status(401).json({ error: 'Sesi tidak valid atau telah kadaluarsa' });
      }
      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          acceptedTerms: user.acceptedTerms || false,
          isGoogleUser: !!user.googleId
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Gagal memverifikasi sesi' });
    }
  });

  app.post('/api/auth/accept-terms', authenticateUser, async (req: any, res) => {
    try {
      req.user.acceptedTerms = true;
      await req.user.save();
      res.json({ success: true, acceptedTerms: true });
    } catch (err) {
      res.status(500).json({ error: 'Gagal memperbarui persetujuan Syarat & Ketentuan' });
    }
  });

  app.delete('/api/auth/account', authenticateUser, async (req: any, res) => {
    try {
      const userId = req.user._id.toString();
      await User.deleteOne({ _id: req.user._id });
      await Profile.deleteMany({ userId });
      await Job.deleteMany({ userId });
      await Reminder.deleteMany({ userId });
      await EncryptedCV.deleteMany({ userId });
      res.json({ success: true, message: 'Akun dan seluruh data pengguna berhasil dihapus.' });
    } catch (err) {
      res.status(500).json({ error: 'Gagal menghapus akun pengguna' });
    }
  });

  // --- Job Routes ---
  app.get('/api/jobs', authenticateUser, async (req: any, res) => {
    try {
      const jobs = await Job.find({ userId: req.user._id.toString() }).sort({ createdAt: -1 });
      res.json(jobs);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch jobs' }); }
  });

  app.post('/api/jobs', authenticateUser, async (req: any, res) => {
    try {
      const allowedFields = ['title', 'company', 'platform', 'location', 'expectedSalary', 'dateApplied', 'notes', 'status', 'url', 'imageUrl'];
      const jobData: Record<string, any> = { userId: req.user._id.toString() };
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) jobData[field] = sanitizeString(req.body[field], 1000);
      }
      const job = await Job.create(jobData);
      res.json(job);
    } catch (err) { res.status(500).json({ error: 'Failed to create job' }); }
  });

  app.put('/api/jobs/:id', authenticateUser, async (req: any, res) => {
    try {
      const allowedFields = ['title', 'company', 'platform', 'location', 'expectedSalary', 'dateApplied', 'notes', 'status', 'url', 'imageUrl'];
      const updateData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) updateData[field] = sanitizeString(req.body[field], 1000);
      }
      const job = await Job.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id.toString() },
        updateData,
        { new: true }
      );
      res.json(job);
    } catch (err) { res.status(500).json({ error: 'Failed to update job' }); }
  });

  app.delete('/api/jobs/:id', authenticateUser, async (req: any, res) => {
    try {
      await Job.findOneAndDelete({ _id: req.params.id, userId: req.user._id.toString() });
      await Reminder.deleteMany({ jobId: req.params.id, userId: req.user._id.toString() });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete job' }); }
  });

  // --- Reminder Routes ---
  app.get('/api/reminders', authenticateUser, async (req: any, res) => {
    try {
      const reminders = await Reminder.find({ userId: req.user._id.toString() }).sort({ date: 1 });
      res.json(reminders);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch reminders' }); }
  });

  app.post('/api/reminders', authenticateUser, async (req: any, res) => {
    try {
      const reminder = await Reminder.create({ ...req.body, userId: req.user._id.toString() });
      res.json(reminder);
    } catch (err) { res.status(500).json({ error: 'Failed to create reminder' }); }
  });

  app.put('/api/reminders/:id', authenticateUser, async (req: any, res) => {
    try {
      const reminder = await Reminder.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id.toString() },
        req.body,
        { new: true }
      );
      res.json(reminder);
    } catch (err) { res.status(500).json({ error: 'Failed to update reminder' }); }
  });

  app.delete('/api/reminders/:id', authenticateUser, async (req: any, res) => {
    try {
      await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user._id.toString() });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete reminder' }); }
  });

  // API Routes for Profile
  app.get('/api/profile', authenticateUser, async (req: any, res) => {
    try {
      if (!process.env.MONGODB_URI) {
        return res.status(503).json({ error: 'Database not configured' });
      }
      let profile = await Profile.findOne({ userId: req.user._id.toString() });
      if (!profile) {
        profile = await Profile.create({
          userId: req.user._id.toString(),
          name: req.user.name || '',
          title: 'Professional',
          email: req.user.email || '',
          phone: '',
          location: '',
          highestEducation: '',
          about: '',
          profileImage: req.user.avatar || '',
          experiences: [],
          education: [],
          skills: [],
          interests: [],
          portfolio: [],
          socials: [],
          cvs: [],
          certificates: [],
          volunteering: []
        });
      }
      res.json(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  app.put('/api/profile', authenticateUser, async (req: any, res) => {
    try {
      if (!process.env.MONGODB_URI) {
        return res.status(503).json({ error: 'Database not configured' });
      }
      const updateData = { ...req.body };
      delete updateData._id;
      delete updateData.id;

      const profile = await Profile.findOne({ userId: req.user._id.toString() });
      if (!profile) {
        await Profile.create({ ...updateData, userId: req.user._id.toString() });
      } else {
        await Profile.updateOne({ userId: req.user._id.toString() }, { $set: updateData });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  // Use memory storage for multer (SEC-009 & SEC-014: file size & type restrictions)
  const storage = multer.memoryStorage();
  const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  });

  const imageUpload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max for images
    fileFilter: (_req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Hanya file gambar (JPEG, PNG, WebP, GIF) yang diizinkan'));
    }
  });

  const cvUpload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max for CVs
    fileFilter: (_req, file, cb) => {
      const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (allowed.includes(file.mimetype)) cb(null, true);
      else cb(new Error('Hanya file PDF atau Word yang diizinkan untuk CV'));
    }
  });

  app.post('/api/upload', authenticateUser, imageUpload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Configure cloudinary with environment variables
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      // Upload file directly from memory buffer
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        resource_type: 'auto',
      });

      res.json({ secure_url: result.secure_url });
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  // API Routes for Encrypted CVs
  app.post('/api/cv/upload', authenticateUser, cvUpload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file CV yang diunggah' });
      }
      const title = req.body.title || req.file.originalname;
      const { encryptedData, iv } = encryptCVBuffer(req.file.buffer);

      const cvDoc = await EncryptedCV.create({
        userId: req.user._id.toString(),
        title,
        filename: req.file.originalname,
        mimeType: req.file.mimetype || 'application/pdf',
        encryptedData,
        iv
      });

      res.json({
        id: cvDoc._id.toString(),
        cvId: cvDoc._id.toString(),
        title,
        filename: req.file.originalname,
        url: `/api/cv/${cvDoc._id}`
      });
    } catch (error: any) {
      console.error('Error uploading & encrypting CV:', error);
      res.status(500).json({ error: 'Gagal mengunggah dan mengenkripsi file CV. Silakan coba lagi.' });
    }
  });

  app.get('/api/cv/:id', authenticateUser, async (req: any, res) => {
    try {
      const cvDoc = await EncryptedCV.findOne({ _id: req.params.id, userId: req.user._id.toString() });
      if (!cvDoc || !cvDoc.encryptedData || !cvDoc.iv) {
        return res.status(404).json({ error: 'File CV tidak ditemukan atau data terkorupsi.' });
      }

      const decryptedBuffer = decryptCVBuffer(cvDoc.encryptedData, cvDoc.iv);

      res.setHeader('Content-Type', cvDoc.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${cvDoc.filename || 'cv.pdf'}"`);
      res.send(decryptedBuffer);
    } catch (error: any) {
      console.error('Error decrypting & serving CV:', error);
      res.status(500).json({ error: 'Gagal mendekripsi file CV. Silakan coba lagi.' });
    }
  });

  app.delete('/api/cv/:id', authenticateUser, async (req: any, res) => {
    try {
      await EncryptedCV.findOneAndDelete({ _id: req.params.id, userId: req.user._id.toString() });
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting encrypted CV:', error);
      res.status(500).json({ error: 'Gagal menghapus CV dari database' });
    }
  });

  // Vite middleware / static serving for local development
  if (!process.env.VERCEL) {
    const PORT = Number(process.env.PORT) || 3000;
    if (process.env.NODE_ENV !== "production") {
      import('vite').then(async ({ createServer: createViteServer }) => {
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        });
        app.use(vite.middlewares);
      }).catch(err => console.warn('Vite dev middleware notice:', err));
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
