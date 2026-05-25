import connectDB from '../lib/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('Health check - DB connection error:', e && e.message ? e.message : e);
    return res.status(500).json({ status: 'error', message: e.message || String(e) });
  }
}
