const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const router = express.Router();

const {
  initiateKyc,
  getKycStatus,
  submitBankDetails,
  uploadKycDocument,
  handleWebhook,
  refreshKycStatus
} = require('../controllers/kycController');

const { protect } = require('../middleware/auth');

// Multer for document upload only (dest: uploads/)
const upload = multer({ dest: 'uploads/' });

// Validation rules
const bankDetailsValidation = [
  body('accountNumber')
    .notEmpty().withMessage('Account number is required')
    .matches(/^\d{9,18}$/).withMessage('Please provide a valid account number'),
  body('ifscCode')
    .notEmpty().withMessage('IFSC code is required')
    .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/).withMessage('Please provide a valid IFSC code'),
  body('beneficiaryName')
    .trim()
    .notEmpty().withMessage('Beneficiary name is required')
    .isLength({ max: 100 }).withMessage('Beneficiary name too long')
];

const stakeholderValidation = [
  body('stakeholder.name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Stakeholder name too long'),
  body('stakeholder.pan')
    .optional()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).withMessage('Please provide a valid PAN number')
];

// Webhook route (no auth required - verified by signature)
router.post('/webhook', handleWebhook);

// Protected routes
router.use(protect);

router.post('/initiate/:merchantId', stakeholderValidation, initiateKyc);
router.get('/status/:merchantId', getKycStatus);
router.post('/bank-details/:merchantId', bankDetailsValidation, submitBankDetails);
router.post('/refresh/:merchantId', refreshKycStatus);
router.post('/upload-document/:merchantId', upload.single('file'), uploadKycDocument);

module.exports = router;