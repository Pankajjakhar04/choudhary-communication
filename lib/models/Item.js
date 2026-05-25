import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  name:             { type: String, required: true },
  nameHindi:        { type: String, default: '' },
  price:            { type: Number, required: true },
  description:      { type: String, default: '' },
  descriptionHindi: { type: String, default: '' },
  imageUrl:         { type: String, required: true },
  imagePublicId:    { type: String, default: '' },
  stock:            { type: Number, default: 0 },
  category:         { type: String, default: 'Mobile' },
  isAvailable:      { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Item || mongoose.model('Item', ItemSchema);
