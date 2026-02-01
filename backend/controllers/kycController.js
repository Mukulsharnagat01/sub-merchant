const fs = require('fs');
const Merchant = require('../models/Merchant');
const razorpayService = require('../services/razorpayService');

/**
 * @desc    Initiate KYC for a merchant
 * @route   POST /api/kyc/initiate/:merchantId
 * @access  Private
 */
const initiateKyc = async (req, res, next) => {
  try {
    const merchant = await Merchant.findById(req.params.merchantId);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    if (!merchant.razorpayAccountId) {
      return res.status(400).json({
        success: false,
        message: 'Merchant not registered with Razorpay yet'
      });
    }

    const isDemoAccount = merchant.razorpayAccountId.startsWith('demo_');

    if (!isDemoAccount) {
      // Add stakeholder for KYC (Razorpay only)
      const { stakeholder } = req.body;
      if (stakeholder) {
        try {
          await razorpayService.addStakeholder(merchant.razorpayAccountId, stakeholder);
        } catch (err) {
          console.error('Failed to add stakeholder:', err.message);
        }
      }

      // Request product configuration (initiates KYC on Razorpay)
      try {
        const product = merchant.businessType === 'individual' ? 'payments' : 'route';
        await razorpayService.requestProductConfiguration(merchant.razorpayAccountId, product);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.error?.description || err.message || 'Failed to initiate KYC'
        });
      }
    }

    // Update merchant status
    merchant.kycStatus = 'pending';
    merchant.kycDetails = {
      ...merchant.kycDetails,
      submittedAt: new Date()
    };
    await merchant.save();

    res.json({
      success: true,
      message: isDemoAccount ? 'KYC initiated (demo mode)' : 'KYC initiated successfully',
      data: {
        merchantId: merchant._id,
        kycStatus: merchant.kycStatus,
        productConfig: isDemoAccount ? { demo: true } : undefined
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get KYC status for a merchant
 * @route   GET /api/kyc/status/:merchantId
 * @access  Private
 */
const getKycStatus = async (req, res, next) => {
  try {
    const merchant = await Merchant.findById(req.params.merchantId);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    res.json({
      success: true,
      data: {
        kycStatus: merchant.kycStatus,
        isActive: merchant.isActive,
        details: merchant.kycDetails
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit bank details for settlement
 * @route   POST /api/kyc/bank-details/:merchantId
 * @access  Private
 */
const submitBankDetails = async (req, res, next) => {
  try {
    const merchant = await Merchant.findById(req.params.merchantId);

    if (!merchant || !merchant.razorpayAccountId) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    const { accountNumber, ifscCode, beneficiaryName } = req.body;

    const isDemoAccount = merchant.razorpayAccountId.startsWith('demo_');

    if (!isDemoAccount) {
      const productConfig = await razorpayService.getProductConfiguration(
        merchant.razorpayAccountId,
        'route'
      );
      await razorpayService.updateProductConfiguration(
        merchant.razorpayAccountId,
        productConfig.id,
        { accountNumber, ifscCode, beneficiaryName }
      );
    }

    merchant.bankDetails = { accountNumber, ifscCode, beneficiaryName };
    await merchant.save();

    res.json({
      success: true,
      message: isDemoAccount ? 'Bank details saved (demo mode)' : 'Bank details submitted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload KYC document
 * @route   POST /api/kyc/upload-document/:merchantId
 * @access  Private
 */
const uploadKycDocument = async (req, res, next) => {
  try {
    const merchant = await Merchant.findById(req.params.merchantId);

    if (!merchant || !merchant.razorpayAccountId) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found or not registered with Razorpay'
      });
    }

    const type = req.body.type || req.body.purpose;
    const file = req.file || req.files?.[0];

    if (!file || !type) {
      return res.status(400).json({
        success: false,
        message: 'File and type required (form-data: file, type)'
      });
    }

    const isDemoAccount = merchant.razorpayAccountId.startsWith('demo_');

    let response;
    if (isDemoAccount) {
      if (file.path && fs.existsSync(file.path)) {
        try { fs.unlinkSync(file.path); } catch (_) {}
      }
      response = { id: `demo_doc_${Date.now()}`, demo: true };
    } else {
      const documentData = { file: file.path, purpose: type };
      response = await razorpayService.uploadDocument(merchant.razorpayAccountId, documentData);
    }

    merchant.documents.push({
      type,
      url: response.demo ? '#' : `https://api.razorpay.com/v1/documents/${response.id}`,
      uploadedAt: new Date(),
      verified: false,
      razorpayDocId: response.id
    });
    await merchant.save();

    res.json({
      success: true,
      message: isDemoAccount ? 'Document saved (demo mode)' : 'Document uploaded successfully',
      data: response
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle Razorpay webhook
 * @route   POST /api/kyc/webhook
 * @access  Public (verified by signature)
 */
const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const rawBody = req.body.toString();

  if (!signature || !secret) {
    return res.status(400).json({ status: 'missing_signature_or_secret' });
  }

  // Verify signature - MUST use raw body string as received
  const isValid = razorpayService.verifyWebhookSignature(rawBody, signature, secret);
  if (!isValid) {
    return res.status(400).json({ status: 'verification_failed' });
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event;

  switch (event) {
    case 'account.activated':
      await handleAccountActivated(payload);
      break;
    case 'account.rejected':
      await handleAccountRejected(payload);
      break;
    case 'account.needs_clarification':
      await handleAccountNeedsClarification(payload);
      break;
    case 'account.suspended':
      await handleAccountSuspended(payload);
      break;
    case 'account.updated':
      await handleAccountUpdated(payload);
      break;
    default:
      console.log('Unhandled event:', event);
  }

  res.json({ status: 'ok' });
};

// Webhook event handlers
async function handleAccountActivated(payload) {
  const accountId = payload.account?.entity?.id;
  if (!accountId) return;

  await Merchant.findOneAndUpdate(
    { razorpayAccountId: accountId },
    {
      kycStatus: 'activated',
      isActive: true,
      'kycDetails.verifiedAt': new Date()
    }
  );
}

async function handleAccountSuspended(payload) {
  const accountId = payload.account?.entity?.id;
  if (!accountId) return;

  await Merchant.findOneAndUpdate(
    { razorpayAccountId: accountId },
    {
      kycStatus: 'suspended',
      isActive: false
    }
  );
}

async function handleAccountRejected(payload) {
  const accountId = payload.account?.entity?.id;
  const reason = payload.account?.entity?.notes?.rejection_reason || 'KYC rejected';
  if (!accountId) return;

  await Merchant.findOneAndUpdate(
    { razorpayAccountId: accountId },
    {
      kycStatus: 'rejected',
      isActive: false,
      'kycDetails.rejectionReason': reason
    }
  );
}

async function handleAccountNeedsClarification(payload) {
  const accountId = payload.account?.entity?.id;
  const reason = payload.account?.entity?.notes?.clarification_reason || 'Additional information required';
  if (!accountId) return;

  await Merchant.findOneAndUpdate(
    { razorpayAccountId: accountId },
    {
      kycStatus: 'needs_clarification',
      'kycDetails.clarificationReason': reason
    }
  );
}

async function handleAccountUpdated(payload) {
  const accountId = payload.account?.entity?.id;
  if (!accountId) return;

  const razorpayData = await razorpayService.getAccountDetails(accountId);
  const newStatus = razorpayService.mapKycStatus(razorpayData.status);

  await Merchant.findOneAndUpdate(
    { razorpayAccountId: accountId },
    {
      kycStatus: newStatus
    }
  );
}

/**
 * @desc    Refresh KYC status from Razorpay
 * @route   POST /api/kyc/refresh/:merchantId
 * @access  Private
 */
const refreshKycStatus = async (req, res, next) => {
  try {
    const merchant = await Merchant.findById(req.params.merchantId);

    if (!merchant || !merchant.razorpayAccountId) {
      return res.status(404).json({
        success: false,
        message: 'Merchant or Razorpay account not found'
      });
    }

    const isDemoAccount = merchant.razorpayAccountId.startsWith('demo_');

    if (isDemoAccount) {
      // Demo mode: return current DB status without calling Razorpay
      return res.json({
        success: true,
        message: 'KYC status (demo mode)',
        data: {
          kycStatus: merchant.kycStatus,
          razorpayStatus: 'demo',
          isActive: merchant.isActive
        }
      });
    }

    // Fetch latest from Razorpay
    const razorpayData = await razorpayService.getAccountDetails(merchant.razorpayAccountId);
    const newStatus = razorpayService.mapKycStatus(razorpayData.status);
    merchant.kycStatus = newStatus;

    if (newStatus === 'activated') {
      merchant.isActive = true;
      merchant.kycDetails.verifiedAt = new Date();
    }

    await merchant.save();

    res.json({
      success: true,
      message: 'KYC status refreshed',
      data: {
        kycStatus: merchant.kycStatus,
        razorpayStatus: razorpayData.status,
        isActive: merchant.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiateKyc,
  getKycStatus,
  submitBankDetails,
  uploadKycDocument,
  handleWebhook,
  refreshKycStatus
};