const Razorpay = require('razorpay');
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

// Initialize Razorpay instance (API Key & Secret - NEVER expose on frontend)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const RAZORPAY_BASE_URL = 'https://api.razorpay.com';

/**
 * Create a sub-merchant account on Razorpay
 * API: POST /v2/accounts
 * Docs: https://razorpay.com/docs/api/partners/account-onboarding/create/
 */
const createSubMerchant = async (merchantData) => {
  try {
    const registeredAddr = {
      street1: merchantData.address?.street || '',
      street2: '',
      city: merchantData.address?.city || '',
      state: merchantData.address?.state || '',
      postal_code: parseInt(merchantData.address?.pincode, 10) || 0,
      country: merchantData.address?.country || 'IN'
    };

    const accountPayload = {
      email: merchantData.email,
      phone: String(merchantData.phone).replace(/\D/g, '').slice(-10) || merchantData.phone,
      legal_business_name: merchantData.businessName,
      customer_facing_business_name: merchantData.businessName,
      business_type: merchantData.businessType,
      contact_name: merchantData.contactName,
      profile: {
        category: merchantData.businessCategory,
        subcategory: merchantData.businessSubCategory || 'others',
        addresses: {
          registered: registeredAddr,
          operation: registeredAddr
        }
      },
      legal_info: {
        pan: merchantData.legalInfo?.pan || undefined,
        gst: merchantData.legalInfo?.gst || undefined
      },
      contact_info: {
        support: {
          email: merchantData.email,
          phone: String(merchantData.phone).replace(/\D/g, '').slice(-10)
        }
      }
    };

    // Remove empty legal_info fields
    if (!accountPayload.legal_info.pan) delete accountPayload.legal_info.pan;
    if (!accountPayload.legal_info.gst) delete accountPayload.legal_info.gst;
    if (Object.keys(accountPayload.legal_info).length === 0) delete accountPayload.legal_info;

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
 * Update account details
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
 * Add stakeholder
 * API: POST /v2/accounts/{account_id}/stakeholders
 */
const addStakeholder = async (accountId, stakeholderData) => {
  try {
    const response = await razorpay.stakeholders.create(accountId, stakeholderData);
    return response;
  } catch (error) {
    console.error('Razorpay Add Stakeholder Error:', error);
    throw error;
  }
};

/**
 * Request product configuration (initiates KYC for Route)
 * API: POST /v1/products
 */
const requestProductConfiguration = async (accountId, product = 'route') => {
  try {
    const payload = {
      product_name: product,
      tnc_accepted: true
    };
    const response = await razorpay.products.request(accountId, payload);
    return response;
  } catch (error) {
    console.error('Razorpay Request Product Config Error:', error);
    throw error;
  }
};

/**
 * Get product configuration
 * API: GET /v1/products/{product_id}
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
 * Update product configuration (for settlements)
 * API: PATCH /v1/products/{product_id}
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
 * Uses Razorpay Documents API (POST /v1/documents) - stores document in Razorpay ecosystem.
 * For Partner account-specific linking, Razorpay dashboard or Onboarding SDK handles KYC doc association.
 * Docs: https://razorpay.com/docs/api/documents/create
 */
const uploadDocument = async (accountId, documentData) => {
  let tempFilePath = documentData.file;
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(tempFilePath));
    form.append('purpose', 'dispute_evidence'); // Razorpay accepts this; KYC docs stored for reference

    const auth = Buffer.from(
      `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
    ).toString('base64');

    const response = await axios.post(
      `${RAZORPAY_BASE_URL}/v1/documents`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Basic ${auth}`
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    // Return doc with account context for storage
    return {
      id: response.data.id,
      entity: response.data.entity,
      purpose: response.data.purpose,
      mime_type: response.data.mime_type,
      size: response.data.size,
      created_at: response.data.created_at,
      account_id: accountId,
      document_type: documentData.purpose
    };
  } catch (error) {
    const errMsg = error.response?.data?.error?.description || error.message;
    console.error('Razorpay Document Upload Error:', errMsg);
    throw error;
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (_) {}
    }
  }
};

/**
 * Verify Razorpay webhook signature
 * @param rawBody - Raw request body string (as received, for signature verification)
 */
const verifyWebhookSignature = (rawBody, signature, secret) => {
  try {
    return Razorpay.validateWebhookSignature(rawBody, signature, secret);
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