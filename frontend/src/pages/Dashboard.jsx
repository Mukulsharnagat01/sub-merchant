import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Total Merchants', 
      value: stats?.total || 0, 
      icon: Users, 
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    { 
      label: 'KYC Activated', 
      value: getStatCount('activated'), 
      icon: CheckCircle, 
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    { 
      label: 'Pending Review', 
      value: getStatCount('pending') + getStatCount('under_review'), 
      icon: Clock, 
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50'
    },
    { 
      label: 'Needs Action', 
      value: getStatCount('needs_clarification') + getStatCount('rejected'), 
      icon: AlertCircle, 
      color: 'bg-red-500',
      bgColor: 'bg-red-50'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your sub-merchant KYC status</p>
        </div>
        <Link
          to="/merchants/create"
          className="inline-flex items-center px-4 py-2 bg-razorpay-blue text-white font-medium rounded-lg hover:bg-razorpay-blue/90 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Merchant
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`${stat.bgColor} rounded-xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Merchants */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/merchants/create"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Plus className="w-5 h-5 text-primary-600" />
                </div>
                <span className="font-medium text-gray-700">Create New Merchant</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              to="/merchants"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-medium text-gray-700">View All Merchants</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
            <Link
              to="/merchants?status=needs_clarification"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <span className="font-medium text-gray-700">Pending Actions</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Recent Merchants */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Merchants</h2>
            <Link to="/merchants" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>

          {recentMerchants.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No merchants yet</p>
              <Link
                to="/merchants/create"
                className="inline-flex items-center mt-3 text-primary-600 hover:text-primary-700 font-medium"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add your first merchant
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">Business Name</th>
                    <th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">KYC Status</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentMerchants.map((merchant) => (
                    <tr key={merchant._id} className="hover:bg-gray-50">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{merchant.businessName}</p>
                        <p className="text-sm text-gray-500">{merchant.businessType}</p>
                      </td>
                      <td className="py-3">
                        <p className="text-sm text-gray-700">{merchant.contactName}</p>
                        <p className="text-sm text-gray-500">{merchant.email}</p>
                      </td>
                      <td className="py-3">
                        <KycStatusBadge status={merchant.kycStatus} />
                      </td>
                      <td className="py-3">
                        <Link
                          to={`/merchants/${merchant._id}`}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
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
      </div>

      {/* KYC Process Info */}
      <div className="bg-gradient-to-r from-razorpay-blue to-razorpay-light rounded-xl p-6 text-white">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-white/20 rounded-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">KYC Process Overview</h3>
            <p className="text-white/80 mb-4">
              The KYC verification typically takes 24-48 hours. Track real-time status updates for all your sub-merchants.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Create Account</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">→</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Submit Documents</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">→</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Under Review</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">→</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Activated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
