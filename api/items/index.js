import connectDB from '../../lib/db.js';
import Item from '../../lib/models/Item.js';
import { verifyAdmin } from '../../lib/authMiddleware.js';
import cloudinary from '../../lib/cloudinary.js';
import formidable from 'formidable';
import fs from 'fs';

// Disable Vercel's default body parser so formidable can read the raw stream
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    if (req.method === 'GET') {
      let isAdmin = false;
      try { verifyAdmin(req); isAdmin = true; } catch {}
      const items = await Item.find(isAdmin ? {} : { isAvailable: true }).sort({ createdAt: -1 });
      return res.status(200).json(items);
    }

    if (req.method === 'POST') {
      try { verifyAdmin(req); }
      catch { return res.status(403).json({ message: 'Unauthorized' }); }

      return new Promise((resolve) => {
        const form = formidable({
          multiples: false,
          maxFileSize: 5 * 1024 * 1024,
        });

        form.parse(req, async (err, fields, files) => {
          if (err) {
            res.status(500).json({ message: 'Upload parsing error: ' + err.message });
            return resolve();
          }

          try {
            const get = (f) => Array.isArray(fields[f]) ? fields[f][0] : fields[f];
            const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

            if (!imageFile) {
              res.status(400).json({ message: 'Image required' });
              return resolve();
            }

            const uploaded = await cloudinary.uploader.upload(imageFile.filepath, {
              folder: 'choudhary-comm/items',
              transformation: [{ quality: 'auto:good', fetch_format: 'auto', width: 600, crop: 'limit' }],
            });

            try { fs.unlinkSync(imageFile.filepath); } catch (e) {}

            const item = await Item.create({
              name:             get('name'),
              nameHindi:        get('nameHindi') || '',
              price:            Number(get('price')),
              stock:            Number(get('stock')),
              description:      get('description') || '',
              descriptionHindi: get('descriptionHindi') || '',
              category:         get('category') || 'Mobile',
              imageUrl:         uploaded.secure_url,
              imagePublicId:    uploaded.public_id,
            });

            res.status(201).json(item);
            resolve();
          } catch (e) {
            res.status(500).json({ message: e.message || 'Server error' });
            resolve();
          }
        });
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}
