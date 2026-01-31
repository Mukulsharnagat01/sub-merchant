const crypto = require('crypto');
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

    // Add stakeholder for KYC
    const { stakeholder } = req.body;
    
    if (stakeholder) {
      try {
        await razorpayService.addStakeholder(merchant.razorpayAccountId, stakeholder);
      } catch (err) {
        console.error('Failed to add stakeholder:', err.message);
        // Continue anyway as stakeholder might already exist
      }
    }

    // Request product configuration (initiates KYC)
    let productConfig;
    try {
      productConfig = await razorpayService.requestProductConfiguration(
        merchant.razorpayAccountId,
        'route'
      );
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Failed to initiate KYC',
        error: err.error?.description || err.message
      });
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
      message: 'KYC initiated successfully',
      data: {
        merchantId: merchant._id,
        kycStatus: merchant.kycStatus,
        productConfig
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

    // Fetch latest status from Razorpay
    let razorpayStatus = null;
    if (merchant.razorpayAccountId) {
      try {
        razorpayStatus = await razorpayService.getAccountDetails(merchant.razorpayAccountId);
        
        // Update local status based on Razorpay status
        const newStatus = razorpayService.mapKycStatus(razorpayStatus.status);
        if (newStatus !== merchant.kycStatus) {
          merchant.kycStatus = newStatus;
          
          if (newStatus === 'activated') {
            merchant.kycDetails.verifiedAt = new Date();
            merchant.isActive = true;
          } else if (newStatus === 'rejected') {
            merchant.kycDetails.rejectionReason = razorpayStatus.notes?.rejection_reason || 'KYC rejected';
          } else if (newStatus === 'needs_clarification') {
            merchant.kycDetails.clarificationReason = razorpayStatus.notes?.clarification_reason || 'Additional information required';
          }
          
          await merchant.save();
        }
      } catch (err) {
        console.error('Failed to fetch Razorpay status:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        merchantId: merchant._id,
        kycStatus: merchant.kycStatus,
        kycDetails: merchant.kycDetails,
        isActive: merchant.isActive,
        razorpayStatus: razorpayStatus?.status || null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Submit bank details for KYC
 * @route   POST /api/kyc/bank-details/:merchantId
 * @access  Private
 */
const submitBankDetails = async (req, res, next) => {
  try {
    const merchant = await Merchant.findById(req.params.merchantId);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    const { accountNumber, ifscCode, beneficiaryName, productId } = req.body;

    // Update bank details in Razorpay
    if (merchant.razorpayAccountId && productId) {
      try {
        await razorpayService.updateProductConfiguration(
          merchant.razorpayAccountId,
          productId,
          { accountNumber, ifscCode, beneficiaryName }
        );
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: 'Failed to update bank details on Razorpay',
          error: err.error?.description || err.message
        });
      }
    }

    // Update in database
    merchant.bankDetails = {
      accountNumber,
      ifscCode,
      beneficiaryName
    };
    await merchant.save();

    res.json({
      success: true,
      message: 'Bank details submitted successfully',
      data: merchant.bankDetails
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Handle Razorpay webhook for KYC updates
 * @route   POST /api/kyc/webhook
 * @access  Public (verified by signature)
 */
const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(req.body, signature, secret);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    const { event, payload } = req.body;

    console.log('Webhook received:', event);

    // Handle different webhook events
    switch (event) {
      case 'account.under_review':
        await handleAccountUnderReview(payload);
        break;
      
      case 'account.activated':
        await handleAccountActivated(payload);
        break;
      
      case 'account.suspended':
        await handleAccountSuspended(payload);
        break;
      
      case 'account.rejected':
        await handleAccountRejected(payload);
        break;
      
      case 'account.needs_clarification':
        await handleAccountNeedsClarification(payload);
        break;
      
      default:
        console.log('Unhandled webhook event:', event);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook Error:', error);
    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true, error: error.message });
  }
};

// Webhook event handlers
async function handleAccountUnderReview(payload) {
  const accountId = payload.account?.entity?.id;
  if (!accountId) return;

  await Merchant.findOneAndUpdate(
    { razorpayAccountId: accountId },
    { kycStatus: 'under_review' }
  );
}

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

    // Fetch latest from Razorpay
    const razorpayData = await razorpayService.getAccountDetails(merchant.razorpayAccountId);
    
    // Map and update status
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
  handleWebhook,
  refreshKycStatus
};
