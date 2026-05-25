import connectDB from '../../lib/db.js';
import Item from '../../lib/models/Item.js';
import { verifyAdmin } from '../../lib/authMiddleware.js';
import cloudinary from '../../lib/cloudinary.js';
import formidable from 'formidable';
import fs from 'fs';

// Disable Vercel's default body parser so formidable can read the raw stream for image uploads
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

      // If the request contains multipart form data (image upload), use formidable
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

              // Map all text fields
              if (fields.name)             updateData.name = get('name');
              if (fields.nameHindi !== undefined) updateData.nameHindi = get('nameHindi');
              if (fields.price)            updateData.price = Number(get('price'));
              if (fields.stock !== undefined) updateData.stock = Number(get('stock'));
              if (fields.category)         updateData.category = get('category');
              if (fields.description !== undefined) updateData.description = get('description');
              if (fields.descriptionHindi !== undefined) updateData.descriptionHindi = get('descriptionHindi');
              if (fields.isAvailable !== undefined) {
                const val = get('isAvailable');
                updateData.isAvailable = val === 'true' || val === true;
              }

              // Handle new image upload
              const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
              if (imageFile) {
                // Get the existing item to clean up old image
                const existingItem = await Item.findById(id);
                if (existingItem && existingItem.imagePublicId) {
                  try { await cloudinary.uploader.destroy(existingItem.imagePublicId); } catch (e) {}
                }

                // Upload new image
                const uploaded = await cloudinary.uploader.upload(imageFile.filepath, {
                  folder: 'choudhary-comm/items',
                  transformation: [{ quality: 'auto:good', fetch_format: 'auto', width: 600, crop: 'limit' }],
                });

                try { fs.unlinkSync(imageFile.filepath); } catch (e) {}

                updateData.imageUrl = uploaded.secure_url;
                updateData.imagePublicId = uploaded.public_id;
              }

              const updated = await Item.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
              if (!updated) {
                res.status(404).json({ message: 'Item not found' });
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
        // JSON body (no image change)
        let body = req.body;
        if (typeof body === 'string') {
          try { body = JSON.parse(body); } catch { body = {}; }
        }
        const updated = await Item.findByIdAndUpdate(id, body, { new: true, runValidators: true });
        if (!updated) return res.status(404).json({ message: 'Item not found' });
        return res.status(200).json(updated);
      }
    }

    if (req.method === 'DELETE') {
      const item = await Item.findById(id);
      if (!item) return res.status(404).json({ message: 'Item not found' });

      if (item.imagePublicId) {
        try { await cloudinary.uploader.destroy(item.imagePublicId); } catch (e) {}
      }

      await item.deleteOne();
      return res.status(200).json({ message: 'Deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Server error' });
  }
}
