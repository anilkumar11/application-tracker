import { useEffect, useState } from 'react';
import { Archive, RotateCcw, Trash2, Search, Calendar, MapPin, Briefcase } from 'lucide-react';
import { applicationApi } from '../lib/api';
import type { ApplicationWithRelations, ApplicationStatus } from '../lib/database.types';
import StatusBadge from './StatusBadge';
import { useToast } from '../contexts/ToastContext';

interface ArchiveViewProps {
  refreshTrigger?: number;
}

export default function ArchiveView({ refreshTrigger }: ArchiveViewProps) {
  const toast = useToast();
  const [archivedApplications, setArchivedApplications] = useState<ApplicationWithRelations[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadArchivedApplications();
  }, [refreshTrigger]);

  useEffect(() => {
    filterApplications();
  }, [archivedApplications, searchQuery]);

  async function loadArchivedApplications() {
    try {
      setLoading(true);
      const archived = await applicationApi.getArchived();
      setArchivedApplications(archived);
    } catch (error) {
      console.error('Error loading archived applications:', error);
      toast.error('Failed to load archived applications');
    } finally {
      setLoading(false);
    }
  }

  function filterApplications() {
    let filtered = archivedApplications;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.company_name.toLowerCase().includes(query) ||
          app.position_title.toLowerCase().includes(query) ||
          app.location?.toLowerCase().includes(query)
      );
    }

    setFilteredApplications(filtered);
  }

  async function handleRestore(id: string) {
    try {
      await applicationApi.update(id, { archived: false });
      toast.success('Application restored successfully');
      await loadArchivedApplications();
    } catch (error) {
      console.error('Error restoring application:', error);
      toast.error('Failed to restore application');
    }
  }

  async function handlePermanentDelete(id: string, companyName: string) {
    if (!confirm(`Are you sure you want to permanently delete the application to ${companyName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await applicationApi.delete(id);
      toast.success('Application permanently deleted');
      await loadArchivedApplications();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Archive</h2>
        <p className="text-gray-600 mt-1">
          Archived applications are hidden from your main view but can be restored anytime
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search archived applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="text-sm text-gray-600">
          {filteredApplications.length} {filteredApplications.length === 1 ? 'item' : 'items'} in archive
        </div>
      </div>

      {filteredApplications.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No matching archived applications' : 'Archive is empty'}
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? 'Try a different search term'
              : 'Archived applications will appear here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {app.company_name}
                    </h3>
                    <StatusBadge status={app.status as ApplicationStatus} />
                  </div>
                  <p className="text-gray-700 font-medium">{app.position_title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRestore(app.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    title="Restore application"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(app.id, app.company_name)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    title="Permanently delete"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(app.application_date).toLocaleDateString()}</span>
                </div>
                {app.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{app.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4" />
                  <span>{app.work_type}</span>
                </div>
              </div>

              {app.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm text-gray-600 line-clamp-2">{app.notes}</p>
                </div>
              )}

              {app.archived_at && (
                <div className="mt-3 text-xs text-gray-500">
                  Archived on {new Date(app.archived_at).toLocaleDateString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredApplications.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2">About the Archive</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Archived applications are hidden from your main applications list</li>
            <li>• You can restore archived applications at any time</li>
            <li>• Permanently deleted applications cannot be recovered</li>
            <li>• Archives help keep your workspace organized without losing data</li>
          </ul>
        </div>
      )}
    </div>
  );
}
