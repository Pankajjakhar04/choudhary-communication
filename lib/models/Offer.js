import mongoose from 'mongoose';

const OfferSchema = new mongoose.Schema({
  title:            { type: String, required: true },
  titleHindi:       { type: String, default: '' },
  description:      { type: String, default: '' },
  descriptionHindi: { type: String, default: '' },
  startDate:        { type: Date },
  endDate:          { type: Date },
  bgColor:          { type: String, default: '#7C3AED' },
  imageUrl:         { type: String, default: '' },
  imagePublicId:    { type: String, default: '' },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Offer || mongoose.model('Offer', OfferSchema);
