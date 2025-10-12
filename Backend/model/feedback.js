import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  feedback_id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false 
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: false,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback_type: {
    type: String,
    required: true,
    enum: ['General', 'Service', 'Facility', 'Staff', 'Equipment', 'Other']
  },
  feedback_message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  is_anonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved'],
    default: 'pending'
  },
  admin_response: {
    type: String,
    required: false,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});


feedbackSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;