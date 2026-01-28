import { useEffect, useState } from 'react';
import { Briefcase, Phone, Award, XCircle, Clock, AlertCircle, Search, Filter, MapPin, Calendar, Users, CheckCircle, RotateCcw, ChevronDown, ChevronUp, Grid3x3, List, ArrowUpDown } from 'lucide-react';
import { applicationApi, followUpApi } from '../lib/api';
import type { ApplicationWithRelations, ApplicationStatus } from '../lib/database.types';
import { APPLICATION_STATUSES } from '../lib/database.types';
import StatsCard from './StatsCard';
import StatusBadge from './StatusBadge';

interface Stats {
  total: number;
  applied: number;
  interviewing: number;
  offers: number;
  rejected: number;
}

interface FollowUpWithApp {
  id: string;
  scheduled_date: string;
  description: string;
  applications: {
    company_name: string;
    position_title: string;
  };
}

interface UnifiedViewProps {
  onSelectApplication: (application: ApplicationWithRelations) => void;
  onEditApplication: (application: ApplicationWithRelations) => void;
  refreshTrigger?: number;
}

export default function UnifiedView({ onSelectApplication, onEditApplication, refreshTrigger }: UnifiedViewProps) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    applied: 0,
    interviewing: 0,
    offers: 0,
    rejected: 0,
  });
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUpWithApp[]>([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState<FollowUpWithApp[]>([]);
  const [completedFollowUps, setCompletedFollowUps] = useState<FollowUpWithApp[]>([]);
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');
  const [sortBy, setSortBy] = useState<'date' | 'company' | 'status'>('date');
  const [followUpTab, setFollowUpTab] = useState<'overdue' | 'upcoming' | 'completed'>('overdue');

  useEffect(() => {
    loadAllData();
  }, [refreshTrigger]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchQuery, statusFilter, sortBy]);

  async function loadAllData() {
    try {
      const [statsData, upcoming, overdue, completed, appsData] = await Promise.all([
        applicationApi.getStats(),
        followUpApi.getUpcoming(),
        followUpApi.getOverdue(),
        followUpApi.getCompleted(5),
        applicationApi.getAll(),
      ]);
      setStats(statsData);
      setUpcomingFollowUps(upcoming);
      setOverdueFollowUps(overdue);
      setCompletedFollowUps(completed);
      setApplications(appsData);
    } catch (error) {
      console.error('Error loading data:', error);
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

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.application_date).getTime() - new Date(a.application_date).getTime();
      } else if (sortBy === 'company') {
        return a.company_name.localeCompare(b.company_name);
      } else if (sortBy === 'status') {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    setFilteredApplications(filtered);
  }

  async function handleCompleteFollowUp(id: string) {
    try {
      await followUpApi.complete(id);
      loadAllData();
    } catch (error) {
      console.error('Error completing follow-up:', error);
    }
  }

  async function handleUncompleteFollowUp(id: string) {
    try {
      await followUpApi.uncomplete(id);
      loadAllData();
    } catch (error) {
      console.error('Error reverting follow-up:', error);
    }
  }

  async function handleQuickStatusUpdate(id: string, newStatus: ApplicationStatus) {
    try {
      await applicationApi.update(id, { status: newStatus });
      setShowStatusDropdown(null);
      loadAllData();
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-gray-600 mt-1">Track your job application progress</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatsCard title="Total Applications" value={stats.total} icon={Briefcase} color="bg-blue-600" />
        <StatsCard title="Applied" value={stats.applied} icon={Clock} color="bg-gray-600" />
        <StatsCard title="Interviewing" value={stats.interviewing} icon={Phone} color="bg-orange-600" />
        <StatsCard title="Offers" value={stats.offers} icon={Award} color="bg-green-600" />
        <StatsCard title="Rejected" value={stats.rejected} icon={XCircle} color="bg-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(overdueFollowUps.length > 0 || upcomingFollowUps.length > 0 || completedFollowUps.length > 0) && (
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-lg font-semibold text-gray-900">Follow-ups</h3>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setFollowUpTab('overdue')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                followUpTab === 'overdue'
                  ? 'text-red-700 bg-red-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Overdue</span>
                {overdueFollowUps.length > 0 && (
                  <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                    {overdueFollowUps.length}
                  </span>
                )}
              </div>
              {followUpTab === 'overdue' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600" />
              )}
            </button>
            <button
              onClick={() => setFollowUpTab('upcoming')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                followUpTab === 'upcoming'
                  ? 'text-blue-700 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Upcoming</span>
                {upcomingFollowUps.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                    {upcomingFollowUps.length}
                  </span>
                )}
              </div>
              {followUpTab === 'upcoming' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
            <button
              onClick={() => setFollowUpTab('completed')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
                followUpTab === 'completed'
                  ? 'text-green-700 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Completed</span>
                {completedFollowUps.length > 0 && (
                  <span className="bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                    {completedFollowUps.length}
                  </span>
                )}
              </div>
              {followUpTab === 'completed' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
              )}
            </button>
          </div>

          <div className="p-4">
            {followUpTab === 'overdue' && (
              <div className="space-y-2">
                {overdueFollowUps.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No overdue follow-ups</p>
                ) : (
                  overdueFollowUps.map((followUp) => (
                    <div key={followUp.id} className="flex items-center justify-between bg-red-50 p-3 rounded-md border border-red-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {followUp.applications.company_name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{followUp.description}</p>
                        <p className="text-xs text-red-600 mt-1">Due: {new Date(followUp.scheduled_date).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => handleCompleteFollowUp(followUp.id)}
                        className="ml-3 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors whitespace-nowrap"
                      >
                        Complete
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {followUpTab === 'upcoming' && (
              <div className="space-y-2">
                {upcomingFollowUps.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No upcoming follow-ups</p>
                ) : (
                  upcomingFollowUps.map((followUp) => (
                    <div key={followUp.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-md hover:bg-gray-100 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {followUp.applications.company_name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{followUp.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(followUp.scheduled_date).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => handleCompleteFollowUp(followUp.id)}
                        className="ml-3 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        Complete
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {followUpTab === 'completed' && (
              <div className="space-y-2">
                {completedFollowUps.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No completed follow-ups</p>
                ) : (
                  completedFollowUps.map((followUp) => (
                    <div key={followUp.id} className="flex items-center justify-between p-3 bg-green-50 rounded-md border border-green-100">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {followUp.applications.company_name}
                        </p>
                        <p className="text-sm text-gray-600 truncate">{followUp.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Completed: {followUp.completed_at ? new Date(followUp.completed_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleUncompleteFollowUp(followUp.id)}
                        className="ml-3 flex items-center gap-1 px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
                        title="Mark as incomplete"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Undo
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
            </div>
          </div>
        )}

        <div className={`${(overdueFollowUps.length > 0 || upcomingFollowUps.length > 0 || completedFollowUps.length > 0) ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Applications</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'card'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Card view"
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'compact'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Compact view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by company, position, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | 'all')}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Statuses</option>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'company' | 'status')}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="date">Sort by Date</option>
              <option value="company">Sort by Company</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start tracking your job applications'}
            </p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredApplications.map((app) => (
              <div
                key={app.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectApplication(app)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">{app.company_name}</h3>
                    <p className="text-gray-700 font-medium">{app.position_title}</p>
                  </div>
                  <StatusBadge status={app.status as ApplicationStatus} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(app.application_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{app.location || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Briefcase className="w-4 h-4" />
                    <span>{app.work_type}</span>
                  </div>
                  {app.referrals && app.referrals.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{app.referrals.length} referral{app.referrals.length > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                  <span className="text-sm text-gray-600 font-medium">Quick update:</span>
                  <div className="flex gap-2 flex-wrap">
                    <div className="relative status-dropdown">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowStatusDropdown(showStatusDropdown === app.id ? null : app.id);
                        }}
                        className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-150"
                      >
                        Change Status
                      </button>
                      {showStatusDropdown === app.id && (
                        <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                          {APPLICATION_STATUSES.filter((s) => s !== app.status).map((status) => (
                            <button
                              key={status}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickStatusUpdate(app.id, status);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditApplication(app);
                      }}
                      className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all duration-150"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSelectApplication(app)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900 truncate">{app.company_name}</h4>
                        <StatusBadge status={app.status as ApplicationStatus} />
                      </div>
                      <p className="text-sm text-gray-600 truncate mb-2">{app.position_title}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(app.application_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{app.location || 'Not specified'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3" />
                          <span>{app.work_type}</span>
                        </div>
                        {app.referrals && app.referrals.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{app.referrals.length} referral{app.referrals.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative status-dropdown">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowStatusDropdown(showStatusDropdown === app.id ? null : app.id);
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                        >
                          Change Status
                        </button>
                        {showStatusDropdown === app.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                            {APPLICATION_STATUSES.filter((s) => s !== app.status).map((status) => (
                              <button
                                key={status}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuickStatusUpdate(app.id, status);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditApplication(app);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors whitespace-nowrap"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
