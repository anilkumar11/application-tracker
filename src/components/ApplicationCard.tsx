import { useState } from 'react';
import {
  MapPin,
  Briefcase,
  Calendar,
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Phone,
  TrendingUp,
  FileText,
  Link as LinkIcon,
} from 'lucide-react';
import type { ApplicationWithRelations, ApplicationStatus } from '../lib/database.types';
import StatusBadge from './StatusBadge';
import TagSelector from './TagSelector';
import { APPLICATION_STATUSES } from '../lib/database.types';

interface ApplicationCardProps {
  application: ApplicationWithRelations;
  onSelect: () => void;
  onEdit: () => void;
  onStatusUpdate: (newStatus: ApplicationStatus) => void;
  showStatusDropdown: boolean;
  onToggleStatusDropdown: () => void;
  onTagsChange: () => void;
}

const statusBorderColors: Record<ApplicationStatus, string> = {
  'Applied': 'border-l-blue-500',
  'Phone Screen': 'border-l-amber-500',
  'Technical Interview': 'border-l-yellow-500',
  'Final Round': 'border-l-orange-500',
  'Offer': 'border-l-green-500',
  'Rejected': 'border-l-red-500',
  'Withdrawn': 'border-l-gray-500',
};

const workTypeIcons: Record<string, { icon: string; color: string }> = {
  'Remote': { icon: '🏠', color: 'bg-green-100 text-green-800' },
  'Hybrid': { icon: '🔄', color: 'bg-blue-100 text-blue-800' },
  'On-site': { icon: '🏢', color: 'bg-gray-100 text-gray-800' },
};

const applicationSourceIcons: Record<string, { icon: string; color: string }> = {
  'LinkedIn': { icon: '💼', color: 'bg-blue-100 text-blue-800' },
  'Company Website': { icon: '🌐', color: 'bg-purple-100 text-purple-800' },
  'Referral': { icon: '🤝', color: 'bg-green-100 text-green-800' },
  'Recruiter': { icon: '📞', color: 'bg-orange-100 text-orange-800' },
  'Job Board': { icon: '📋', color: 'bg-cyan-100 text-cyan-800' },
  'Other': { icon: '📌', color: 'bg-gray-100 text-gray-800' },
};

export default function ApplicationCard({
  application,
  onSelect,
  onEdit,
  onStatusUpdate,
  showStatusDropdown,
  onToggleStatusDropdown,
  onTagsChange,
}: ApplicationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const upcomingInterviews = application.interview_rounds?.filter(
    (r) => r.status === 'Scheduled' && new Date(r.interview_date) > new Date()
  ) || [];

  const completedInterviews = application.interview_rounds?.filter(
    (r) => r.status === 'Completed'
  ) || [];

  const totalInterviews = application.interview_rounds?.length || 0;

  const pendingFollowUps = application.follow_ups?.filter(
    (f) => !f.completed && new Date(f.scheduled_date) >= new Date(new Date().toDateString())
  ) || [];

  const overdueFollowUps = application.follow_ups?.filter(
    (f) => !f.completed && new Date(f.scheduled_date) < new Date(new Date().toDateString())
  ) || [];

  const daysSinceApplication = Math.floor(
    (new Date().getTime() - new Date(application.application_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysSinceLastUpdate = application.status_history && application.status_history.length > 0
    ? Math.floor(
        (new Date().getTime() - new Date(application.status_history[0].changed_at).getTime()) / (1000 * 60 * 60 * 24)
      )
    : daysSinceApplication;

  const nextInterview = upcomingInterviews.sort(
    (a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime()
  )[0];

  const daysUntilNextInterview = nextInterview
    ? Math.ceil(
        (new Date(nextInterview.interview_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  const hasContacts = application.ta_contact_name || application.hr_coordinator_name;
  const hasDocuments = application.documents_url;
  const hasJobUrl = application.job_url;

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const sourceInfo = applicationSourceIcons[application.application_source] || applicationSourceIcons['Other'];
  const workTypeInfo = workTypeIcons[application.work_type] || { icon: '💼', color: 'bg-gray-100 text-gray-800' };

  const getCompanyInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      className={`bg-white border-l-4 border-t border-r border-b border-gray-200 rounded-lg hover:shadow-xl transition-all duration-300 cursor-pointer group ${statusBorderColors[application.status as ApplicationStatus]}`}
      onClick={onSelect}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2.5 flex-1">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
              {getCompanyInitials(application.company_name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900 truncate">{application.company_name}</h3>
                <StatusBadge status={application.status as ApplicationStatus} size="sm" />
                {daysSinceApplication <= 7 && (
                  <span className="px-1.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                    New
                  </span>
                )}
                {daysSinceLastUpdate >= 14 && application.status !== 'Offer' && application.status !== 'Rejected' && (
                  <span className="px-1.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Needs attention
                  </span>
                )}
              </div>
              <p className="text-gray-700 font-medium mb-1">{application.position_title}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${sourceInfo.color} flex items-center gap-1`}>
                  <span>{sourceInfo.icon}</span>
                  {application.application_source}
                </span>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-md ${workTypeInfo.color} flex items-center gap-1`}>
                  <span>{workTypeInfo.icon}</span>
                  {application.work_type}
                </span>
              </div>
            </div>
          </div>
        </div>

        {application.tags && application.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {application.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: tag.color + '20',
                  color: tag.color,
                  borderWidth: '1px',
                  borderColor: tag.color + '40',
                }}
              >
                {tag.name}
              </span>
            ))}
            {application.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                +{application.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {(overdueFollowUps.length > 0 || nextInterview || pendingFollowUps.length > 0 || totalInterviews > 0) && (
          <div className="mb-2.5 space-y-1.5">
            {overdueFollowUps.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="text-sm font-medium text-red-900">
                  {overdueFollowUps.length} overdue follow-up{overdueFollowUps.length > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {nextInterview && daysUntilNextInterview !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-sm font-medium text-blue-900">
                  {nextInterview.round_type} in {daysUntilNextInterview} day{daysUntilNextInterview !== 1 ? 's' : ''}
                  {nextInterview.interviewer_name && ` with ${nextInterview.interviewer_name}`}
                </span>
              </div>
            )}

            {pendingFollowUps.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-medium text-amber-900">
                  {pendingFollowUps.length} upcoming follow-up{pendingFollowUps.length > 1 ? 's' : ''}
                </span>
              </div>
            )}

            {totalInterviews > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm font-medium text-green-900">
                  {completedInterviews.length}/{totalInterviews} interview rounds completed
                </span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">
              Applied {daysSinceApplication} day{daysSinceApplication !== 1 ? 's' : ''} ago
            </span>
          </div>

          {application.location && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{application.location}</span>
            </div>
          )}

          {application.salary_range && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <DollarSign className="w-4 h-4 flex-shrink-0" />
              <span className="truncate font-medium text-green-700">{application.salary_range}</span>
            </div>
          )}

          {application.referrals && application.referrals.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {application.referrals.length} referral{application.referrals.length > 1 ? 's' : ''}: {application.referrals.map(r => r.name).join(', ')}
              </span>
            </div>
          )}

          {hasContacts && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">
                {application.ta_contact_name || application.hr_coordinator_name}
              </span>
            </div>
          )}

          {(hasDocuments || hasJobUrl) && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              {hasDocuments && <FileText className="w-4 h-4 flex-shrink-0" />}
              {hasJobUrl && <LinkIcon className="w-4 h-4 flex-shrink-0" />}
              <span className="truncate">
                {[hasDocuments && 'Documents', hasJobUrl && 'Job URL'].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
        </div>

        {totalInterviews > 0 && (
          <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Interview Progress</span>
              <span className="text-xs font-semibold text-blue-600">
                {Math.round((completedInterviews.length / totalInterviews) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-green-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${(completedInterviews.length / totalInterviews) * 100}%` }}
              />
            </div>
          </div>
        )}

        {isExpanded && application.notes && (
          <div className="mb-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-1.5">
              <FileText className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-700 mb-0.5">Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{application.notes}</p>
              </div>
            </div>
          </div>
        )}

        {isExpanded && (hasContacts || hasDocuments || hasJobUrl) && (
          <div className="mb-2.5 space-y-1.5">
            {(application.ta_contact_name || application.hr_coordinator_name) && (
              <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-900 mb-1.5">Contacts</p>
                <div className="space-y-0.5">
                  {application.ta_contact_name && (
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">TA:</span> {application.ta_contact_name}
                      {application.ta_contact_phone && ` • ${application.ta_contact_phone}`}
                    </div>
                  )}
                  {application.hr_coordinator_name && (
                    <div className="text-sm text-blue-800">
                      <span className="font-medium">HR:</span> {application.hr_coordinator_name}
                      {application.hr_coordinator_phone && ` • ${application.hr_coordinator_phone}`}
                    </div>
                  )}
                </div>
              </div>
            )}

            {(hasDocuments || hasJobUrl) && (
              <div className="flex gap-1.5">
                {hasJobUrl && (
                  <a
                    href={application.job_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Job Posting
                  </a>
                )}
                {hasDocuments && (
                  <a
                    href={application.documents_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    Documents
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-200">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-150"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {isExpanded ? 'Less' : 'More'}
          </button>

          <div className="relative status-dropdown">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatusDropdown();
              }}
              className="px-2.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-150"
            >
              Change Status
            </button>
            {showStatusDropdown && (
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-1">
                {APPLICATION_STATUSES.filter((s) => s !== application.status).map((status) => (
                  <button
                    key={status}
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusUpdate(status);
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
              onEdit();
            }}
            className="px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all duration-150"
          >
            Edit
          </button>

          <TagSelector
            applicationId={application.id}
            selectedTags={application.tags || []}
            onTagsChange={onTagsChange}
          />

          {application.notes && !isExpanded && (
            <div className="ml-auto text-xs text-gray-500 italic truncate max-w-xs">
              {truncateText(application.notes, 50)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
