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

    try { verifyAdmin(req); }
    catch { return res.status(403).json({ message: 'Unauthorized' }); }

    const { id } = req.query;

    if (req.method === 'PUT') {
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
              const updateData = {};

              if (fields.title)             updateData.title = get('title');
              if (fields.titleHindi !== undefined) updateData.titleHindi = get('titleHindi');
              if (fields.description !== undefined) updateData.description = get('description');
              if (fields.descriptionHindi !== undefined) updateData.descriptionHindi = get('descriptionHindi');
              if (fields.bgColor)           updateData.bgColor = get('bgColor');
              if (fields.isActive !== undefined) {
                const val = get('isActive');
                updateData.isActive = val === 'true' || val === true;
              }

              const startDate = get('startDate');
              const endDate = get('endDate');
              if (startDate && startDate !== '') updateData.startDate = startDate;
              else if (startDate === '') updateData.$unset = { ...updateData.$unset, startDate: 1 };
              if (endDate && endDate !== '') updateData.endDate = endDate;
              else if (endDate === '') {
                updateData.$unset = updateData.$unset || {};
                updateData.$unset.endDate = 1;
              }

              // Handle new image
              const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
              if (imageFile) {
                const existingOffer = await Offer.findById(id);
                if (existingOffer && existingOffer.imagePublicId) {
                  try { await cloudinary.uploader.destroy(existingOffer.imagePublicId); } catch (e) {}
                }
                const uploaded = await cloudinary.uploader.upload(imageFile.filepath, {
                  folder: 'choudhary-comm/offers',
                  transformation: [{ quality: 'auto:good', fetch_format: 'auto', width: 800, crop: 'limit' }],
                });
                try { fs.unlinkSync(imageFile.filepath); } catch (e) {}
                updateData.imageUrl = uploaded.secure_url;
                updateData.imagePublicId = uploaded.public_id;
              }

              const updated = await Offer.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
              if (!updated) {
                res.status(404).json({ message: 'Offer not found' });
                return resolve();
              }
              res.status(200).json(updated);
              resolve();
            } catch (e) {
              res.status(500).json({ message: e.message || 'Server error' });
              resolve();
            }
          });
        });
      } else {
        let body = req.body;
        if (typeof body === 'string') {
          try { body = JSON.parse(body); } catch { body = {}; }
        }
        if (body.startDate === '') delete body.startDate;
        if (body.endDate === '') delete body.endDate;

        const updated = await Offer.findByIdAndUpdate(id, body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: 'Offer not found' });
        return res.status(200).json(updated);
      }
    }

    if (req.method === 'DELETE') {
      const offer = await Offer.findById(id);
      if (!offer) return res.status(404).json({ message: 'Offer not found' });

      // Clean up Cloudinary image if exists
      if (offer.imagePublicId) {
        try { await cloudinary.uploader.destroy(offer.imagePublicId); } catch (e) {}
      }

      await offer.deleteOne();
      return res.status(200).json({ message: 'Deleted' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}
