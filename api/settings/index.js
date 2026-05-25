import connectDB from '../../lib/db.js';
import Settings from '../../lib/models/Settings.js';
import { verifyAdmin } from '../../lib/authMiddleware.js';

const DEFAULTS = {
  _key: 'shop_settings',
  shopName: 'Choudhary Communications',
  shopNameHindi: 'चौधरी कम्युनिकेशंस',
  whatsapp: '',
  phone: '',
  address: '',
  addressHindi: '',
  googleMapsLink: '',
  shopTimings: '',
  shopTimingsHindi: '',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      // Public — anyone can read settings
      let settings = await Settings.findOne({ _key: 'shop_settings' });
      if (!settings) {
        // First time — seed from env vars
        settings = await Settings.create({
          ...DEFAULTS,
          shopName:  process.env.SHOP_NAME  || DEFAULTS.shopName,
          whatsapp:  process.env.SHOP_WHATSAPP || DEFAULTS.whatsapp,
          phone:     process.env.SHOP_PHONE    || DEFAULTS.phone,
          address:   process.env.SHOP_ADDRESS  || DEFAULTS.address,
        });
      }
      return res.status(200).json(settings);
    }

    if (req.method === 'PUT') {
      try { verifyAdmin(req); }
      catch { return res.status(403).json({ message: 'Unauthorized' }); }

      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
      }

      const allowed = [
        'shopName', 'shopNameHindi', 'whatsapp', 'phone',
        'address', 'addressHindi', 'googleMapsLink',
        'shopTimings', 'shopTimingsHindi',
        'announcementText', 'announcementTextHindi', 'showAnnouncement'
      ];
      const updateData = {};
      for (const key of allowed) {
        if (body[key] !== undefined) updateData[key] = body[key];
      }

      const settings = await Settings.findOneAndUpdate(
        { _key: 'shop_settings' },
        updateData,
        { new: true, upsert: true, runValidators: true },
      );
      return res.status(200).json(settings);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}
