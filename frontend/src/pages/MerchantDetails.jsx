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
      setMerchant(response.data.data);
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
      toast.error('Failed to initiate KYC');
    } finally {
      setInitiatingKyc(false);
    }
  };

  const handleSubmitBank = async () => {
    try {
      await kycAPI.submitBankDetails(id, merchant.bankDetails);
      toast.success('Bank details submitted');
    } catch (error) {
      toast.error('Failed to submit bank details');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!merchant) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/merchants" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{merchant.businessName}</h1>
          <KycStatusBadge status={merchant.kycStatus} />
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleInitiateKyc}
          disabled={initiatingKyc || merchant.kycStatus !== 'not_started'}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-razorpay-blue text-white rounded-lg hover:bg-razorpay-blue/90 disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          <span>Initiate KYC</span>
        </button>
        <button
          onClick={handleSubmitBank}
          disabled={!merchant.bankDetails?.accountNumber || merchant.kycStatus === 'not_started'}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <CreditCard className="w-4 h-4" />
          <span>Submit Bank Details</span>
        </button>
        <button
          onClick={handleRefreshStatus}
          disabled={refreshing}
          className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh Status</span>
        </button>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Business Name</p>
              <p className="font-medium text-gray-900">{merchant.businessName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="font-medium text-gray-900 capitalize">{merchant.businessType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-medium text-gray-900 capitalize">{merchant.businessCategory}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Razorpay ID</p>
              <p className="font-medium text-gray-900">{merchant.razorpayAccountId || 'Not created'}</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Contact Name</p>
              <p className="font-medium text-gray-900">{merchant.contactName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">{merchant.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium text-gray-900">{merchant.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-medium text-gray-900">
                {merchant.address?.street}, {merchant.address?.city}, {merchant.address?.state} {merchant.address?.pincode}
              </p>
            </div>
          </div>
        </div>

        {/* Legal Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legal Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">PAN</p>
              <p className="font-medium text-gray-900">{merchant.legalInfo?.pan || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">GST</p>
              <p className="font-medium text-gray-900">{merchant.legalInfo?.gst || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
          {merchant.bankDetails?.accountNumber ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Account Number</p>
                <p className="font-medium text-gray-900">{merchant.bankDetails.accountNumber}</p>
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

        {/* Documents (new section) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents</h3>
          <div className="space-y-4">
            {merchant.documents.length > 0 ? (
              merchant.documents.map((doc, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 capitalize">{doc.type}</p>
                    <p className="text-sm text-gray-500">Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                  </div>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View</a>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No documents uploaded yet</p>
            )}
          </div>
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
          {merchant.kycDetails?.rejectionReason && (
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <p className="text-gray-900">KYC rejected</p>
                <p className="text-sm text-gray-500">{merchant.kycDetails.rejectionReason}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MerchantDetails;