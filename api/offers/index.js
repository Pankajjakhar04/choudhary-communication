import connectDB from '../../lib/db.js';
import Offer from '../../lib/models/Offer.js';
import { verifyAdmin } from '../../lib/authMiddleware.js';
import cloudinary from '../../lib/cloudinary.js';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

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

      if (isAdmin) {
        const offers = await Offer.find({}).sort({ createdAt: -1 });
        return res.status(200).json(offers);
      }

      const now = new Date();
      const offers = await Offer.find({
        isActive: true,
        $or: [{ endDate: { $gte: now } }, { endDate: null }, { endDate: { $exists: false } }],
      }).sort({ createdAt: -1 });
      return res.status(200).json(offers);
    }

    if (req.method === 'POST') {
      try { verifyAdmin(req); }
      catch { return res.status(403).json({ message: 'Unauthorized' }); }

      const contentType = req.headers['content-type'] || '';

      if (contentType.includes('multipart/form-data')) {
        return new Promise((resolve) => {
          const form = formidable({ multiples: false, maxFileSize: 5 * 1024 * 1024 });

          form.parse(req, async (err, fields, files) => {
            if (err) {
              res.status(500).json({ message: 'Upload parsing error: ' + err.message });
              return resolve();
            }
            try {
              const get = (f) => Array.isArray(fields[f]) ? fields[f][0] : fields[f];

              const offerData = {
                title:            get('title'),
                titleHindi:       get('titleHindi') || '',
                description:      get('description') || '',
                descriptionHindi: get('descriptionHindi') || '',
                bgColor:          get('bgColor') || '#7C3AED',
              };

              const isActiveVal = get('isActive');
              offerData.isActive = isActiveVal === 'true' || isActiveVal === true;

              const startDate = get('startDate');
              const endDate = get('endDate');
              if (startDate && startDate !== '') offerData.startDate = startDate;
              if (endDate && endDate !== '') offerData.endDate = endDate;

              // Handle image upload
              const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
              if (imageFile) {
                const uploaded = await cloudinary.uploader.upload(imageFile.filepath, {
                  folder: 'choudhary-comm/offers',
                  transformation: [{ quality: 'auto:good', fetch_format: 'auto', width: 800, crop: 'limit' }],
                });
                try { fs.unlinkSync(imageFile.filepath); } catch (e) {}
                offerData.imageUrl = uploaded.secure_url;
                offerData.imagePublicId = uploaded.public_id;
              }

              const offer = await Offer.create(offerData);
              res.status(201).json(offer);
              resolve();
            } catch (e) {
              res.status(500).json({ message: e.message || 'Server error' });
              resolve();
            }
          });
        });
      } else {
        // JSON body (no image)
        let body = req.body;
        if (typeof body === 'string') {
          try { body = JSON.parse(body); } catch { body = {}; }
        }
        if (body.startDate === '') delete body.startDate;
        if (body.endDate === '') delete body.endDate;

        const offer = await Offer.create(body);
        return res.status(201).json(offer);
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}
