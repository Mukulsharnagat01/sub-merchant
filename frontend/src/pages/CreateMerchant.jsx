import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  ArrowLeft,
  ArrowRight,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { merchantAPI, kycAPI } from '../services/api';

const CreateMerchant = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues
  } = useForm({
    defaultValues: {
      businessType: 'individual',
      businessCategory: 'ecommerce',
      address: { country: 'IN' }
    }
  });

  const businessTypes = [
    { value: 'individual', label: 'Individual / Sole Proprietor' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'private_limited', label: 'Private Limited' },
    { value: 'public_limited', label: 'Public Limited' },
    { value: 'llp', label: 'LLP' },
    { value: 'ngo', label: 'NGO' },
    { value: 'trust', label: 'Trust' },
    { value: 'society', label: 'Society' },
    { value: 'other', label: 'Other' }
  ];

  const businessCategories = [
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'food', label: 'Food & Beverages' },
    { value: 'travel', label: 'Travel & Hospitality' },
    { value: 'retail', label: 'Retail' },
    { value: 'services', label: 'Professional Services' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'government', label: 'Government' },
    { value: 'others', label: 'Others' }
  ];

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['businessName', 'businessType', 'businessCategory', 'contactName', 'email', 'phone'];
    } else if (step === 2) {
      fieldsToValidate = ['address.street', 'address.city', 'address.state', 'address.pincode'];
    } else if (step === 3) {
      // For documents, validate files if needed
      // Note: File validation is client-side, but we can add custom logic
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Build merchant payload (exclude file fields)
      const { panFile, gstFile, ...merchantPayload } = data;
      const response = await merchantAPI.create(merchantPayload);
      const merchantId = response.data.data._id;

      // Upload documents if provided
      if (panFile?.[0]) {
        const formData = new FormData();
        formData.append('file', panFile[0]);
        formData.append('type', 'pan');
        await kycAPI.uploadDocument(merchantId, formData);
      }
      if (gstFile?.[0]) {
        const formData = new FormData();
        formData.append('file', gstFile[0]);
        formData.append('type', 'gst_certificate');
        await kycAPI.uploadDocument(merchantId, formData);
      }

      // Auto-initiate KYC after creation
      try {
        await kycAPI.initiate(merchantId, {});
      } catch (kycErr) {
        console.warn('KYC initiate optional:', kycErr?.response?.data?.message);
      }

      toast.success('Merchant created! KYC initiated. Check status on merchant details.');
      navigate('/merchants');
    } catch (error) {
      const res = error.response?.data;
      console.error('Create merchant error:', res || error.message);
      let msg = res?.message || res?.errors?.map(e => e.msg).join(', ') || 'Failed to create merchant';
      if (res?.hint) msg += ` — ${res.hint}`;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Create New Sub-Merchant</h2>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${s === step ? 'bg-razorpay-blue text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                {s}
              </div>
              {s < 3 && <div className="w-20 h-1 bg-gray-200" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className={step !== 1 ? 'hidden' : ''}>
            {/* Step 1: Business Details */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('businessName', { required: 'Business name is required' })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter business name"
                  />
                </div>
                {errors.businessName && <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                <select
                  {...register('businessType', { required: 'Business type is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.businessType && <p className="mt-1 text-sm text-red-600">{errors.businessType.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Category</label>
                <select
                  {...register('businessCategory', { required: 'Business category is required' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {businessCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                {errors.businessCategory && <p className="mt-1 text-sm text-red-600">{errors.businessCategory.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('contactName', { required: 'Contact name is required' })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter contact name"
                  />
                </div>
                {errors.contactName && <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' } })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="contact@business.com"
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('phone', { required: 'Phone is required', pattern: { value: /^[0-9]{10}$/, message: 'Invalid phone' } })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="9876543210"
                  />
                </div>
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
              </div>
            </div>
          </div>

          <div className={step !== 2 ? 'hidden' : ''}>
            {/* Step 2: Address & Legal Info */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('address.street', { required: 'Street address is required' })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter street address"
                  />
                </div>
                {errors.address?.street && <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    {...register('address.city', { required: 'City is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="City"
                  />
                  {errors.address?.city && <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    {...register('address.state', { required: 'State is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="State"
                  />
                  {errors.address?.state && <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                <input
                  {...register('address.pincode', { required: 'Pincode is required', pattern: { value: /^\d{6}$/, message: 'Invalid pincode' } })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="6-digit pincode"
                />
                {errors.address?.pincode && <p className="mt-1 text-sm text-red-600">{errors.address.pincode.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('legalInfo.pan', { pattern: { value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, message: 'Invalid PAN' } })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="AAAAA9999A"
                    />
                  </div>
                  {errors.legalInfo?.pan && <p className="mt-1 text-sm text-red-600">{errors.legalInfo.pan.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('legalInfo.gst', { pattern: { value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, message: 'Invalid GST' } })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                  {errors.legalInfo?.gst && <p className="mt-1 text-sm text-red-600">{errors.legalInfo.gst.message}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className={step !== 3 ? 'hidden' : ''}>
            {/* Step 3: Bank Details & Documents (updated with file uploads) */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('bankDetails.accountNumber', { pattern: { value: /^\d{9,18}$/, message: 'Invalid account number' } })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter account number"
                  />
                </div>
                {errors.bankDetails?.accountNumber && <p className="mt-1 text-sm text-red-600">{errors.bankDetails.accountNumber.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                  <input
                    {...register('bankDetails.ifscCode', { pattern: { value: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC' } })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="ABCD0123456"
                  />
                  {errors.bankDetails?.ifscCode && <p className="mt-1 text-sm text-red-600">{errors.bankDetails.ifscCode.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary Name</label>
                  <input
                    {...register('bankDetails.beneficiaryName')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Account holder name"
                  />
                </div>
              </div>

              {/* Document Uploads (new) */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Document</label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="file"
                      {...register('panFile')}
                      accept=".pdf,.jpg,.png"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST Certificate</label>
                  <div className="relative">
                    <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="file"
                      {...register('gstFile')}
                      accept=".pdf,.jpg,.png"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Add more file inputs for other docs if needed */}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center px-6 py-2.5 text-gray-700 font-medium hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-6 py-2.5 bg-razorpay-blue text-white font-medium rounded-lg hover:bg-razorpay-blue/90 transition-colors"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Merchant'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMerchant;