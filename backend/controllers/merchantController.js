const { validationResult } = require('express-validator');
const Merchant = require('../models/Merchant');
const razorpayService = require('../services/razorpayService');

/**
 * @desc    Create a new sub-merchant
 * @route   POST /api/merchant/create
 * @access  Private
 */
const createMerchant = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      businessName,
      businessType,
      businessCategory,
      businessSubCategory,
      contactName,
      email,
      phone,
      address,
      legalInfo,
      bankDetails
    } = req.body;

    // Check if merchant with same email exists
    const existingMerchant = await Merchant.findOne({ email });
    if (existingMerchant) {
      return res.status(400).json({
        success: false,
        message: 'Merchant with this email already exists'
      });
    }

    // Create merchant in Razorpay
    let razorpayAccount;
    try {
      razorpayAccount = await razorpayService.createSubMerchant({
        businessName,
        businessType,
        businessCategory,
        businessSubCategory,
        contactName,
        email,
        phone,
        address,
        legalInfo
      });
    } catch (razorpayError) {
      console.error('Razorpay API Error:', razorpayError);
      return res.status(400).json({
        success: false,
        message: 'Failed to create merchant on Razorpay',
        error: razorpayError.error?.description || razorpayError.message
      });
    }

    // Create merchant in database
    const merchant = await Merchant.create({
      createdBy: req.user._id,
      razorpayAccountId: razorpayAccount.id,
      businessName,
      businessType,
      businessCategory,
      businessSubCategory,
      contactName,
      email,
      phone,
      address,
      legalInfo,
      bankDetails,
      kycStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Sub-merchant created successfully',
      data: {
        merchant,
        razorpayAccountId: razorpayAccount.id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get merchant by ID
 * @route   GET /api/merchant/:id
 * @access  Private
 */
const getMerchant = async (req, res, next) => {
  try {
    const merchant = await Merchant.findById(req.params.id).populate('createdBy', 'name email');

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Fetch latest status from Razorpay if account exists
    let razorpayData = null;
    if (merchant.razorpayAccountId) {
      try {
        razorpayData = await razorpayService.getAccountDetails(merchant.razorpayAccountId);
      } catch (err) {
        console.error('Failed to fetch Razorpay data:', err.message);
      }
    }

    res.json({
      success: true,
      data: {
        merchant,
        razorpayData
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all merchants (for logged-in user)
 * @route   GET /api/merchant/list
 * @access  Private
 */
const getMerchants = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    // Build query
    const query = { createdBy: req.user._id };

    if (status && status !== 'all') {
      query.kycStatus = status;
    }

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactName: { $regex: search, $options: 'i' } }
      ];
    }

    const merchants = await Merchant.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Merchant.countDocuments(query);

    res.json({
      success: true,
      data: {
        merchants,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update merchant details
 * @route   PUT /api/merchant/:id
 * @access  Private
 */
const updateMerchant = async (req, res, next) => {
  try {
    let merchant = await Merchant.findById(req.params.id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Check ownership
    if (merchant.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this merchant'
      });
    }

    // Update in Razorpay if account exists
    if (merchant.razorpayAccountId && req.body.updateRazorpay) {
      try {
        await razorpayService.updateAccount(merchant.razorpayAccountId, {
          legal_business_name: req.body.businessName,
          contact_name: req.body.contactName
        });
      } catch (err) {
        console.error('Failed to update Razorpay account:', err.message);
      }
    }

    // Update in database
    merchant = await Merchant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: merchant
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete merchant
 * @route   DELETE /api/merchant/:id
 * @access  Private
 */
const deleteMerchant = async (req, res, next) => {
  try {
    const merchant = await Merchant.findById(req.params.id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: 'Merchant not found'
      });
    }

    // Check ownership
    if (merchant.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this merchant'
      });
    }

    await merchant.deleteOne();

    res.json({
      success: true,
      message: 'Merchant deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get merchant statistics
 * @route   GET /api/merchant/stats
 * @access  Private
 */
const getMerchantStats = async (req, res, next) => {
  try {
    const stats = await Merchant.aggregate([
      { $match: { createdBy: req.user._id } },
      {
        $group: {
          _id: '$kycStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalMerchants = await Merchant.countDocuments({ createdBy: req.user._id });

    res.json({
      success: true,
      data: {
        total: totalMerchants,
        byStatus: stats
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMerchant,
  getMerchant,
  getMerchants,
  updateMerchant,
  deleteMerchant,
  getMerchantStats
};
