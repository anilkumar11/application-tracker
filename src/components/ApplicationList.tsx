import { useEffect, useState } from 'react';
import { Search, Filter, Briefcase } from 'lucide-react';
import { applicationApi } from '../lib/api';
import type { ApplicationWithRelations, ApplicationStatus } from '../lib/database.types';
import { APPLICATION_STATUSES } from '../lib/database.types';
import ApplicationCard from './ApplicationCard';

interface ApplicationListProps {
  onSelectApplication: (application: ApplicationWithRelations) => void;
  onEditApplication: (application: ApplicationWithRelations) => void;
  refreshTrigger?: number;
}

export default function ApplicationList({ onSelectApplication, onEditApplication, refreshTrigger }: ApplicationListProps) {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadApplications();
  }, [refreshTrigger]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchQuery, statusFilter]);

  async function loadApplications() {
    try {
      const data = await applicationApi.getAll();
      setApplications(data);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterApplications() {
    let filtered = applications;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.company_name.toLowerCase().includes(query) ||
          app.position_title.toLowerCase().includes(query) ||
          app.location.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    setFilteredApplications(filtered);
  }

  async function handleQuickStatusUpdate(id: string, newStatus: ApplicationStatus) {
    try {
      await applicationApi.update(id, { status: newStatus });
      setShowStatusDropdown(null);
      loadApplications();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showStatusDropdown && !(event.target as Element).closest('.status-dropdown')) {
        setShowStatusDropdown(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusDropdown]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-30 bg-gray-50 py-4 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by company, position, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white shadow-sm"
            >
              <option value="all">All Statuses</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-12 text-center shadow-sm">
          <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-md">
            <Briefcase className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your search or filters to see more results'
              : 'Start your job search journey by adding your first application'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <p className="text-sm text-gray-500">
              Tip: Click the "Add Application" button in the header to get started
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApplications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onSelect={() => onSelectApplication(app)}
              onEdit={() => onEditApplication(app)}
              onStatusUpdate={(newStatus) => handleQuickStatusUpdate(app.id, newStatus)}
              showStatusDropdown={showStatusDropdown === app.id}
              onToggleStatusDropdown={() => setShowStatusDropdown(showStatusDropdown === app.id ? null : app.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
