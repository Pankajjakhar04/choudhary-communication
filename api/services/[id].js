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

    try { verifyAdmin(req); }
    catch { return res.status(403).json({ message: 'Unauthorized' }); }

    const { id } = req.query;

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }

    if (req.method === 'PUT') {
      const updated = await Service.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!updated) return res.status(404).json({ message: 'Service not found' });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const service = await Service.findByIdAndDelete(id);
      if (!service) return res.status(404).json({ message: 'Service not found' });
      return res.status(200).json({ message: 'Deleted' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}
