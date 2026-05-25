import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  nameHindi:  { type: String, default: '' },
  icon:       { type: String, default: '🔧' },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
