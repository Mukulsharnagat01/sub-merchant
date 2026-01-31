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
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { merchantAPI } from '../services/api';

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
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await merchantAPI.create(data);
      toast.success('Merchant created successfully!');
      navigate(`/merchants/${response.data.data.merchant._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create merchant');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Business Details' },
    { number: 2, title: 'Address' },
    { number: 3, title: 'Legal & Bank' }
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Create Sub-Merchant</h1>
        <p className="text-gray-600">Fill in the details to onboard a new sub-merchant</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s.number} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full font-medium
                ${step >= s.number 
                  ? 'bg-razorpay-blue text-white' 
                  : 'bg-gray-200 text-gray-600'}
              `}>
                {s.number}
              </div>
              <span className={`ml-2 hidden sm:inline ${step >= s.number ? 'text-gray-900' : 'text-gray-500'}`}>
                {s.title}
              </span>
              {idx < steps.length - 1 && (
                <div className={`w-12 sm:w-24 h-1 mx-2 sm:mx-4 ${step > s.number ? 'bg-razorpay-blue' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {/* Step 1: Business Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-6">
                <Building2 className="w-5 h-5" />
                <span>Business Details</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    {...register('businessName', { required: 'Business name is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter legal business name"
                  />
                  {errors.businessName && (
                    <p className="mt-1 text-sm text-red-600">{errors.businessName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Type *
                  </label>
                  <select
                    {...register('businessType', { required: 'Business type is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    {businessTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business Category *
                  </label>
                  <select
                    {...register('businessCategory', { required: 'Business category is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                  >
                    {businessCategories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-1" />
                    Contact Name *
                  </label>
                  <input
                    type="text"
                    {...register('contactName', { required: 'Contact name is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Full name"
                  />
                  {errors.contactName && (
                    <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="business@example.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    {...register('phone', { 
                      required: 'Phone is required',
                      pattern: {
                        value: /^[6-9]\d{9}$/,
                        message: 'Enter valid 10-digit mobile number'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="9876543210"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Address */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-6">
                <MapPin className="w-5 h-5" />
                <span>Business Address</span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    {...register('address.street', { required: 'Street address is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Building, Street, Locality"
                  />
                  {errors.address?.street && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    {...register('address.city', { required: 'City is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="City"
                  />
                  {errors.address?.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    {...register('address.state', { required: 'State is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="State"
                  />
                  {errors.address?.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.state.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    {...register('address.pincode', { 
                      required: 'Pincode is required',
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'Enter valid 6-digit pincode'
                      }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="123456"
                    maxLength={6}
                  />
                  {errors.address?.pincode && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.pincode.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    {...register('address.country')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                    value="India"
                    disabled
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Legal & Bank Details */}
          {step === 3 && (
            <div className="space-y-8">
              {/* Legal Info */}
              <div>
                <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-6">
                  <FileText className="w-5 h-5" />
                  <span>Legal Information</span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      {...register('legalInfo.pan', {
                        pattern: {
                          value: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
                          message: 'Enter valid PAN (e.g., ABCDE1234F)'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                    {errors.legalInfo?.pan && (
                      <p className="mt-1 text-sm text-red-600">{errors.legalInfo.pan.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Number
                    </label>
                    <input
                      type="text"
                      {...register('legalInfo.gst', {
                        pattern: {
                          value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
                          message: 'Enter valid GST number'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                    />
                    {errors.legalInfo?.gst && (
                      <p className="mt-1 text-sm text-red-600">{errors.legalInfo.gst.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div>
                <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900 mb-6">
                  <CreditCard className="w-5 h-5" />
                  <span>Bank Account Details</span>
                  <span className="text-sm font-normal text-gray-500">(Optional)</span>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Number
                    </label>
                    <input
                      type="text"
                      {...register('bankDetails.accountNumber')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Account number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      {...register('bankDetails.ifscCode', {
                        pattern: {
                          value: /^[A-Z]{4}0[A-Z0-9]{6}$/,
                          message: 'Enter valid IFSC code'
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
                      placeholder="SBIN0001234"
                      maxLength={11}
                    />
                    {errors.bankDetails?.ifscCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.bankDetails.ifscCode.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beneficiary Name
                    </label>
                    <input
                      type="text"
                      {...register('bankDetails.beneficiaryName')}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Account holder name"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

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
        </div>
      </form>
    </div>
  );
};

export default CreateMerchant;
