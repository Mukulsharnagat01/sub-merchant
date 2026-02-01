import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  Building2
} from 'lucide-react';
import { merchantAPI } from '../services/api';
import toast from 'react-hot-toast';
import KycStatusBadge from '../components/KycStatusBadge';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentMerchants, setRecentMerchants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, merchantsRes] = await Promise.all([
        merchantAPI.getStats(),
        merchantAPI.getList({ limit: 5 })
      ]);

      setStats(statsRes.data.data);
      setRecentMerchants(merchantsRes.data.data.merchants);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatCount = (status) => {
    if (!stats?.byStatus) return 0;
    const stat = stats.byStatus.find(s => s._id === status);
    return stat?.count || 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Manage and track your sub-merchants onboarding & KYC status
          </p>
        </div>

        <Link
          to="/merchants/create"
          className="flex items-center space-x-2 px-6 py-3 bg-razorpay-blue text-white font-medium rounded-lg hover:bg-razorpay-blue/90 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Merchant</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Merchants</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.total || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">KYC Activated</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{getStatCount('activated')}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">
                {getStatCount('pending') + getStatCount('under_review') + getStatCount('needs_clarification')}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Problematic</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                {getStatCount('rejected') + getStatCount('suspended')}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Merchants */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recent Merchants</h2>
          <Link
            to="/merchants"
            className="text-razorpay-blue hover:text-razorpay-blue/80 font-medium flex items-center gap-1"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentMerchants.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No merchants yet</h3>
            <p className="text-gray-500 mb-6">Start by adding your first sub-merchant</p>
            <Link
              to="/merchants/create"
              className="inline-flex items-center px-6 py-3 bg-razorpay-blue text-white font-medium rounded-lg hover:bg-razorpay-blue/90"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create First Merchant
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Merchant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentMerchants.map((merchant) => (
                  <tr key={merchant._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {merchant.businessName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {merchant.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <KycStatusBadge status={merchant.kycStatus} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(merchant.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/merchants/${merchant._id}`}
                        className="text-razorpay-blue hover:text-razorpay-blue/80"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Info / Tips Card */}
      <div className="bg-gradient-to-r from-razorpay-blue to-blue-700 rounded-xl p-8 text-white shadow-lg">
        <div className="max-w-3xl">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-white/20 rounded-xl">
              <TrendingUp className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3">Razorpay Sub-Merchant Onboarding</h3>
              <p className="text-white/90 mb-6 leading-relaxed">
                Create sub-merchants, initiate KYC, upload documents, submit bank details and track real-time status updates — all from one dashboard.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                  Create → KYC → Documents → Bank → Activated
                </div>
                <div className="bg-white/20 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                  Average approval time: 24–72 hours
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;