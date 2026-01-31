import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  CreditCard,
  RefreshCw,
  Play,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { merchantAPI, kycAPI } from '../services/api';
import KycStatusBadge from '../components/KycStatusBadge';

const MerchantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [initiatingKyc, setInitiatingKyc] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMerchant();
  }, [id]);

  const fetchMerchant = async () => {
    try {
      const response = await merchantAPI.getById(id);
      setMerchant(response.data.data.merchant);
    } catch (error) {
      toast.error('Failed to load merchant details');
      navigate('/merchants');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const response = await kycAPI.refresh(id);
      setMerchant(prev => ({
        ...prev,
        kycStatus: response.data.data.kycStatus,
        isActive: response.data.data.isActive
      }));
      toast.success('KYC status refreshed');
    } catch (error) {
      toast.error('Failed to refresh status');
    } finally {
      setRefreshing(false);
    }
  };

  const handleInitiateKyc = async () => {
    setInitiatingKyc(true);
    try {
      await kycAPI.initiate(id, {});
      toast.success('KYC process initiated');
      fetchMerchant();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate KYC');
    } finally {
      setInitiatingKyc(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this merchant?')) return;
    
    setDeleting(true);
    try {
      await merchantAPI.delete(id);
      toast.success('Merchant deleted');
      navigate('/merchants');
    } catch (error) {
      toast.error('Failed to delete merchant');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'activated':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'pending':
      case 'under_review':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'needs_clarification':
        return <AlertCircle className="w-6 h-6 text-orange-500" />;
      case 'rejected':
      case 'suspended':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!merchant) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{merchant.businessName}</h1>
            <p className="text-gray-600 capitalize">{merchant.businessType.replace('_', ' ')} • {merchant.businessCategory}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
          title="Delete Merchant"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* KYC Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">KYC Status</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefreshStatus}
              disabled={refreshing}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {merchant.kycStatus === 'not_started' && (
              <button
                onClick={handleInitiateKyc}
                disabled={initiatingKyc}
                className="flex items-center px-4 py-1.5 text-sm bg-razorpay-blue text-white rounded-lg hover:bg-razorpay-blue/90 disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-2" />
                {initiatingKyc ? 'Initiating...' : 'Initiate KYC'}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          {getStatusIcon(merchant.kycStatus)}
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <KycStatusBadge status={merchant.kycStatus} />
              {merchant.isActive && (
                <span className="text-sm text-green-600 font-medium">Account Active</span>
              )}
            </div>
            {merchant.kycDetails?.submittedAt && (
              <p className="text-sm text-gray-500 mt-1">
                Submitted: {new Date(merchant.kycDetails.submittedAt).toLocaleString()}
              </p>
            )}
            {merchant.kycDetails?.verifiedAt && (
              <p className="text-sm text-green-600 mt-1">
                Verified: {new Date(merchant.kycDetails.verifiedAt).toLocaleString()}
              </p>
            )}
            {merchant.kycDetails?.rejectionReason && (
              <p className="text-sm text-red-600 mt-1">
                Reason: {merchant.kycDetails.rejectionReason}
              </p>
            )}
            {merchant.kycDetails?.clarificationReason && (
              <p className="text-sm text-orange-600 mt-1">
                Clarification needed: {merchant.kycDetails.clarificationReason}
              </p>
            )}
          </div>
        </div>

        {merchant.razorpayAccountId && (
          <p className="mt-4 text-sm text-gray-500">
            Razorpay Account ID: <code className="bg-gray-100 px-2 py-0.5 rounded">{merchant.razorpayAccountId}</code>
          </p>
        )}
      </div>

      {/* Merchant Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <User className="w-5 h-5 mr-2" />
            Contact Details
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Contact Name</p>
              <p className="font-medium text-gray-900">{merchant.contactName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center">
                <Mail className="w-4 h-4 mr-1" /> Email
              </p>
              <p className="font-medium text-gray-900">{merchant.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 flex items-center">
                <Phone className="w-4 h-4 mr-1" /> Phone
              </p>
              <p className="font-medium text-gray-900">{merchant.phone}</p>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <MapPin className="w-5 h-5 mr-2" />
            Business Address
          </h3>
          {merchant.address ? (
            <div className="space-y-2">
              <p className="text-gray-900">{merchant.address.street}</p>
              <p className="text-gray-700">
                {merchant.address.city}, {merchant.address.state} - {merchant.address.pincode}
              </p>
              <p className="text-gray-500">{merchant.address.country || 'India'}</p>
            </div>
          ) : (
            <p className="text-gray-500">No address provided</p>
          )}
        </div>

        {/* Legal Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <FileText className="w-5 h-5 mr-2" />
            Legal Information
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">PAN Number</p>
              <p className="font-medium text-gray-900">{merchant.legalInfo?.pan || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">GST Number</p>
              <p className="font-medium text-gray-900">{merchant.legalInfo?.gst || '-'}</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="flex items-center text-lg font-semibold text-gray-900 mb-4">
            <CreditCard className="w-5 h-5 mr-2" />
            Bank Details
          </h3>
          {merchant.bankDetails?.accountNumber ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="font-medium text-gray-900">
                  ****{merchant.bankDetails.accountNumber.slice(-4)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">IFSC Code</p>
                <p className="font-medium text-gray-900">{merchant.bankDetails.ifscCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Beneficiary Name</p>
                <p className="font-medium text-gray-900">{merchant.bankDetails.beneficiaryName}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No bank details provided</p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="text-gray-900">Merchant created</p>
              <p className="text-sm text-gray-500">{new Date(merchant.createdAt).toLocaleString()}</p>
            </div>
          </div>
          {merchant.kycDetails?.submittedAt && (
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-gray-900">KYC initiated</p>
                <p className="text-sm text-gray-500">{new Date(merchant.kycDetails.submittedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
          {merchant.kycDetails?.verifiedAt && (
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-gray-900">KYC verified & activated</p>
                <p className="text-sm text-gray-500">{new Date(merchant.kycDetails.verifiedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantDetails;
