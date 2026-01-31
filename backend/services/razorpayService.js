const Razorpay = require('razorpay');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a sub-merchant account on Razorpay
 * API: POST /v2/accounts
 * Docs: https://razorpay.com/docs/api/partners/account-onboarding
 */
const createSubMerchant = async (merchantData) => {
  try {
    const accountPayload = {
      email: merchantData.email,
      phone: {
        primary: merchantData.phone,
        secondary: merchantData.phone
      },
      type: merchantData.businessType === 'individual' ? 'standard' : 'route',
      legal_business_name: merchantData.businessName,
      business_type: merchantData.businessType,
      contact_name: merchantData.contactName,
      profile: {
        category: merchantData.businessCategory,
        subcategory: merchantData.businessSubCategory || 'others',
        addresses: {
          registered: {
            street1: merchantData.address?.street || '',
            street2: '',
            city: merchantData.address?.city || '',
            state: merchantData.address?.state || '',
            postal_code: parseInt(merchantData.address?.pincode) || 0,
            country: merchantData.address?.country || 'IN'
          }
        }
      },
      legal_info: {
        pan: merchantData.legalInfo?.pan || '',
        gst: merchantData.legalInfo?.gst || ''
      }
    };

    // Make API call to create account
    const response = await razorpay.accounts.create(accountPayload);
    return response;
  } catch (error) {
    console.error('Razorpay Create Account Error:', error);
    throw error;
  }
};

/**
 * Get account/merchant details from Razorpay
 * API: GET /v2/accounts/{account_id}
 */
const getAccountDetails = async (accountId) => {
  try {
    const response = await razorpay.accounts.fetch(accountId);
    return response;
  } catch (error) {
    console.error('Razorpay Fetch Account Error:', error);
    throw error;
  }
};

/**
 * Update merchant account
 * API: PATCH /v2/accounts/{account_id}
 */
const updateAccount = async (accountId, updateData) => {
  try {
    const response = await razorpay.accounts.edit(accountId, updateData);
    return response;
  } catch (error) {
    console.error('Razorpay Update Account Error:', error);
    throw error;
  }
};

/**
 * Add stakeholder (for KYC)
 * API: POST /v2/accounts/{account_id}/stakeholders
 */
const addStakeholder = async (accountId, stakeholderData) => {
  try {
    const payload = {
      name: stakeholderData.name,
      email: stakeholderData.email,
      phone: {
        primary: stakeholderData.phone,
        secondary: stakeholderData.phone
      },
      relationship: {
        director: stakeholderData.isDirector || false,
        executive: stakeholderData.isExecutive || true
      },
      addresses: {
        residential: {
          street: stakeholderData.address?.street || '',
          city: stakeholderData.address?.city || '',
          state: stakeholderData.address?.state || '',
          postal_code: parseInt(stakeholderData.address?.pincode) || 0,
          country: stakeholderData.address?.country || 'IN'
        }
      },
      kyc: {
        pan: stakeholderData.pan || ''
      }
    };

    const response = await razorpay.stakeholders.create(accountId, payload);
    return response;
  } catch (error) {
    console.error('Razorpay Add Stakeholder Error:', error);
    throw error;
  }
};

/**
 * Request KYC verification for product configuration
 * API: POST /v2/accounts/{account_id}/products
 */
const requestProductConfiguration = async (accountId, productName = 'route') => {
  try {
    const payload = {
      product_name: productName,
      requested_at: Math.floor(Date.now() / 1000)
    };

    const response = await razorpay.products.requestProductConfiguration(accountId, payload);
    return response;
  } catch (error) {
    console.error('Razorpay Product Configuration Error:', error);
    throw error;
  }
};

/**
 * Get product configuration (KYC status)
 * API: GET /v2/accounts/{account_id}/products/{product_id}
 */
const getProductConfiguration = async (accountId, productId) => {
  try {
    const response = await razorpay.products.fetch(accountId, productId);
    return response;
  } catch (error) {
    console.error('Razorpay Get Product Config Error:', error);
    throw error;
  }
};

/**
 * Update product configuration with bank details
 */
const updateProductConfiguration = async (accountId, productId, settlementData) => {
  try {
    const payload = {
      settlements: {
        account_number: settlementData.accountNumber,
        ifsc_code: settlementData.ifscCode,
        beneficiary_name: settlementData.beneficiaryName
      },
      tnc_accepted: true
    };

    const response = await razorpay.products.edit(accountId, productId, payload);
    return response;
  } catch (error) {
    console.error('Razorpay Update Product Config Error:', error);
    throw error;
  }
};

/**
 * Upload document for KYC
 * Note: This uses Razorpay Document Upload API
 */
const uploadDocument = async (accountId, documentData) => {
  try {
    // Razorpay document upload requires multipart form data
    // This is a placeholder - actual implementation depends on file handling
    const response = await razorpay.documents.create(accountId, documentData);
    return response;
  } catch (error) {
    console.error('Razorpay Document Upload Error:', error);
    throw error;
  }
};

/**
 * Verify Razorpay webhook signature
 */
const verifyWebhookSignature = (body, signature, secret) => {
  try {
    return Razorpay.validateWebhookSignature(
      JSON.stringify(body),
      signature,
      secret
    );
  } catch (error) {
    console.error('Webhook Signature Verification Error:', error);
    return false;
  }
};

/**
 * Map Razorpay status to internal KYC status
 */
const mapKycStatus = (razorpayStatus) => {
  const statusMap = {
    'created': 'pending',
    'pending': 'pending',
    'under_review': 'under_review',
    'needs_clarification': 'needs_clarification',
    'activated': 'activated',
    'suspended': 'suspended',
    'rejected': 'rejected'
  };
  return statusMap[razorpayStatus] || 'pending';
};

module.exports = {
  razorpay,
  createSubMerchant,
  getAccountDetails,
  updateAccount,
  addStakeholder,
  requestProductConfiguration,
  getProductConfiguration,
  updateProductConfiguration,
  uploadDocument,
  verifyWebhookSignature,
  mapKycStatus
};
