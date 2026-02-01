const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createMerchant,
  getMerchant,
  getMerchants,
  updateMerchant,
  deleteMerchant,
  getMerchantStats
} = require('../controllers/merchantController');

const { protect } = require('../middleware/auth');

// Validation rules
const createMerchantValidation = [
  body('businessName')
    .trim()
    .notEmpty().withMessage('Business name is required')
    .isLength({ max: 200 }).withMessage('Business name too long'),
  body('businessType')
    .notEmpty().withMessage('Business type is required')
    .isIn(['individual', 'partnership', 'private_limited', 'public_limited', 'llp', 'ngo', 'trust', 'society', 'other'])
    .withMessage('Invalid business type'),
  body('businessCategory')
    .notEmpty().withMessage('Business category is required'),
  body('contactName')
    .trim()
    .notEmpty().withMessage('Contact name is required')
    .isLength({ max: 100 }).withMessage('Contact name too long'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email'),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .trim()
    .custom((val) => {
      const digits = (val || '').replace(/\D/g, '');
      return digits.length >= 10 && /^[6-9]/.test(digits.slice(-10));
    })
    .withMessage('Please provide a valid 10-digit Indian phone number (e.g. 9876543210)'),
  body('address.pincode')
    .optional()
    .matches(/^\d{6}$/).withMessage('Please provide a valid 6-digit pincode'),
  body('legalInfo.pan')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Please provide a valid PAN number'),
  body('legalInfo.gst')
    .optional()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please provide a valid GST number')
];

// Routes
router.use(protect); // All routes require authentication

router.get('/stats', getMerchantStats);
router.get('/list', getMerchants);
router.post('/create', createMerchantValidation, createMerchant);
router.get('/:id', getMerchant);
router.put('/:id', updateMerchant);
router.delete('/:id', deleteMerchant);

module.exports = router;