const mongoose = require('mongoose');

const merchantSchema = new mongoose.Schema({
  // Reference to user who created this merchant
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Razorpay Account ID (returned after account creation)
  razorpayAccountId: {
    type: String,
    unique: true,
    sparse: true
  },

  // Business Details
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  businessType: {
    type: String,
    enum: ['individual', 'partnership', 'private_limited', 'public_limited', 'llp', 'ngo', 'trust', 'society', 'other'],
    required: true
  },
  businessCategory: {
    type: String,
    required: true
  },
  businessSubCategory: {
    type: String
  },

  // Contact Person Details
  contactName: {
    type: String,
    required: [true, 'Contact name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Phone is required']
  },

  // Address
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'IN'
    }
  },

  // Legal Info
  legalInfo: {
    pan: String,
    gst: String
  },

  // Bank Details
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    beneficiaryName: String
  },

  // KYC Status
  kycStatus: {
    type: String,
    enum: ['not_started', 'pending', 'under_review', 'needs_clarification', 'activated', 'suspended', 'rejected'],
    default: 'not_started'
  },
  kycDetails: {
    submittedAt: Date,
    verifiedAt: Date,
    rejectionReason: String,
    clarificationReason: String
  },

  // Documents (updated to store uploaded docs metadata)
  documents: [{
    type: {
      type: String,
      enum: ['pan', 'gst_certificate', 'bank_statement', 'cancelled_cheque', 'address_proof', 'business_proof']
    },
    url: String,
    uploadedAt: Date,
    verified: Boolean,
    razorpayDocId: String // From Razorpay response
  }],

  // Activation Status
  isActive: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
merchantSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Merchant', merchantSchema);