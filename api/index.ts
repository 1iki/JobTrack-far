// Vercel Serverless Function Handler
// Note: VERCEL env var is automatically set by Vercel runtime

let appInstance: any = null;
let loadError: Error | null = null;

// Lazy-load the Express app to catch and report any module-level crashes
async function getApp() {
  if (loadError) throw loadError;
  if (appInstance) return appInstance;

  try {
    const mod = await import('../server.js');
    appInstance = mod.app;
    return appInstance;
  } catch (err: any) {
    loadError = err;
    throw err;
  }
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return app(req, res);
  } catch (err: any) {
    console.error('Serverless function init error:', err);
    res.status(500).json({
      error: 'Server initialization failed',
      message: err?.message || 'Unknown error',
      stack: process.env.NODE_ENV !== 'production' ? err?.stack : undefined
    });
  }
}
