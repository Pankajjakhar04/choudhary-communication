import mongoose from 'mongoose';

const CustomerGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  inviteLink: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
}, { timestamps: true });

export default mongoose.models.CustomerGroup || mongoose.model('CustomerGroup', CustomerGroupSchema);
