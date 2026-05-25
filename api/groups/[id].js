import connectDB from '../../lib/db.js';
import CustomerGroup from '../../lib/models/CustomerGroup.js';
import { verifyAdmin } from '../../lib/authMiddleware.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();
    try { verifyAdmin(req); } catch { return res.status(403).json({ message: 'Unauthorized' }); }

    const { id } = req.query;

    if (req.method === 'PUT') {
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      const group = await CustomerGroup.findByIdAndUpdate(id, body, { new: true, runValidators: true });
      if (!group) return res.status(404).json({ message: 'Group not found' });
      return res.status(200).json(group);
    }

    if (req.method === 'DELETE') {
      const group = await CustomerGroup.findByIdAndDelete(id);
      if (!group) return res.status(404).json({ message: 'Group not found' });
      return res.status(200).json({ message: 'Group deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}
