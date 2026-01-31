const statusConfig = {
  not_started: {
    label: 'Not Started',
    color: 'gray',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-600'
  },
  pending: {
    label: 'Pending',
    color: 'yellow',
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-800'
  },
  under_review: {
    label: 'Under Review',
    color: 'blue',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800'
  },
  needs_clarification: {
    label: 'Needs Clarification',
    color: 'orange',
    bgClass: 'bg-orange-100',
    textClass: 'text-orange-800'
  },
  activated: {
    label: 'Activated',
    color: 'green',
    bgClass: 'bg-green-100',
    textClass: 'text-green-800'
  },
  suspended: {
    label: 'Suspended',
    color: 'gray',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-800'
  },
  rejected: {
    label: 'Rejected',
    color: 'red',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800'
  }
};

const KycStatusBadge = ({ status }) => {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgClass} ${config.textClass}`}>
      {config.label}
    </span>
  );
};

export default KycStatusBadge;
