import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  // Singleton — only one document should exist
  _key:             { type: String, default: 'shop_settings', unique: true },

  shopName:         { type: String, default: 'Choudhary Communications' },
  shopNameHindi:    { type: String, default: 'चौधरी कम्युनिकेशंस' },
  whatsapp:         { type: String, default: '' },
  phone:            { type: String, default: '' },
  address:          { type: String, default: '' },
  addressHindi:     { type: String, default: '' },
  googleMapsLink:   { type: String, default: '' },
  shopTimings:      { type: String, default: '' },
  shopTimingsHindi: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
