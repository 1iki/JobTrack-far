// Diagnostic endpoint to check if serverless functions work at all
export default function handler(req: any, res: any) {
  const envCheck = {
    VERCEL: process.env.VERCEL || 'NOT SET',
    MONGODB_URI: process.env.MONGODB_URI ? 'SET (' + process.env.MONGODB_URI.substring(0, 30) + '...)' : 'NOT SET',
    VITE_GOOGLE_CLIENT_ID: process.env.VITE_GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
    NODE_VERSION: process.version,
    timestamp: new Date().toISOString(),
  };
  res.status(200).json({ status: 'ok', env: envCheck });
}
