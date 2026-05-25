import connectDB from '../../lib/db.js';
import CustomerGroup from '../../lib/models/CustomerGroup.js';
import { verifyAdmin } from '../../lib/authMiddleware.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      try { verifyAdmin(req); } catch { return res.status(403).json({ message: 'Unauthorized' }); }
      const groups = await CustomerGroup.find({}).sort({ createdAt: -1 });
      return res.status(200).json(groups);
    }

    if (req.method === 'POST') {
      try { verifyAdmin(req); } catch { return res.status(403).json({ message: 'Unauthorized' }); }
      
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      const group = await CustomerGroup.create(body);
      return res.status(201).json(group);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}
