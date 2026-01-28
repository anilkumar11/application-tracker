import React from 'react';
import type { ApplicationStatus } from '../lib/database.types';

interface StatusBadgeProps {
  status: ApplicationStatus;
  size?: 'sm' | 'md';
}

const statusColors: Record<ApplicationStatus, string> = {
  'Applied': 'bg-blue-100 text-blue-800',
  'Phone Screen': 'bg-amber-100 text-amber-800',
  'Technical Interview': 'bg-yellow-100 text-yellow-800',
  'Final Round': 'bg-orange-100 text-orange-800',
  'Offer': 'bg-green-100 text-green-800',
  'Rejected': 'bg-red-100 text-red-800',
  'Withdrawn': 'bg-gray-100 text-gray-800',
};

function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${statusColors[status]}`}>
      {status}
    </span>
  );
}

export default React.memo(StatusBadge);
