import connectDB from '../../lib/db.js';
import Service from '../../lib/models/Service.js';
import { verifyAdmin } from '../../lib/authMiddleware.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      let isAdmin = false;
      try { verifyAdmin(req); isAdmin = true; } catch {}
      const services = await Service.find(isAdmin ? {} : { isActive: true }).sort({ createdAt: -1 });
      return res.status(200).json(services);
    }

    if (req.method === 'POST') {
      try { verifyAdmin(req); }
      catch { return res.status(403).json({ message: 'Unauthorized' }); }

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      const service = await Service.create(body);
      return res.status(201).json(service);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}
