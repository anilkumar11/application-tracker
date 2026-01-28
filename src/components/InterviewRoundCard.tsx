import { Calendar, CheckCircle, XCircle, Edit, Trash2, Linkedin, Download, Copy, RefreshCw } from 'lucide-react';
import type { InterviewRound } from '../lib/database.types';
import { downloadInterviewCalendar, formatRelativeTime, getDayLabel, getUrgencyLevel } from '../lib/calendar';

interface InterviewRoundCardProps {
  interviewRound: InterviewRound;
  companyName: string;
  positionTitle: string;
  onEdit: (round: InterviewRound) => void;
  onDelete: (id: string) => void;
  onMarkComplete: (round: InterviewRound) => void;
  onReschedule: (round: InterviewRound) => void;
}

const statusConfig = {
  Scheduled: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800',
    icon: Calendar,
  },
  Completed: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    badge: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  Cancelled: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    badge: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
};

const sentimentConfig = {
  Positive: { bg: 'bg-green-100', text: 'text-green-800', emoji: '😊' },
  Negative: { bg: 'bg-red-100', text: 'text-red-800', emoji: '😞' },
  Neutral: { bg: 'bg-gray-100', text: 'text-gray-800', emoji: '😐' },
  Mixed: { bg: 'bg-yellow-100', text: 'text-yellow-800', emoji: '🤔' },
};

const urgencyColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-orange-100 text-orange-800',
  low: 'bg-green-100 text-green-800',
};

export default function InterviewRoundCard({
  interviewRound,
  companyName,
  positionTitle,
  onEdit,
  onDelete,
  onMarkComplete,
  onReschedule,
}: InterviewRoundCardProps) {
  const config = statusConfig[interviewRound.status as keyof typeof statusConfig];
  const StatusIcon = config.icon;
  const dayLabel = getDayLabel(interviewRound.interview_date);
  const urgency = getUrgencyLevel(interviewRound.interview_date);

  const handleDownloadCalendar = () => {
    downloadInterviewCalendar(interviewRound, companyName, positionTitle);
  };

  const handleCopyLinkedIn = () => {
    if (interviewRound.interviewer_linkedin_url) {
      navigator.clipboard.writeText(interviewRound.interviewer_linkedin_url);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this interview round?')) {
      onDelete(interviewRound.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg p-4 space-y-3`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-white rounded-full border-2 border-gray-300">
            <span className="text-lg font-bold text-gray-700">{interviewRound.round_number}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">{interviewRound.round_type}</h3>
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.badge}`}>
                {interviewRound.status}
              </span>
              {dayLabel && interviewRound.status === 'Scheduled' && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${urgencyColors[urgency]}`}>
                  {dayLabel}
                </span>
              )}
            </div>
            <p className={`text-sm ${config.text} mt-1`}>
              <StatusIcon className="inline w-4 h-4 mr-1" />
              {formatDate(interviewRound.interview_date)}
              {interviewRound.status === 'Scheduled' && (
                <span className="ml-2 font-medium">
                  ({formatRelativeTime(interviewRound.interview_date)})
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {interviewRound.status === 'Scheduled' && (
            <>
              <button
                onClick={handleDownloadCalendar}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                title="Add to calendar"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onMarkComplete(interviewRound)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Mark Complete
              </button>
            </>
          )}
          {interviewRound.status === 'Cancelled' && (
            <button
              onClick={() => onReschedule(interviewRound)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Reschedule
            </button>
          )}
          <button
            onClick={() => onEdit(interviewRound)}
            className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Interviewer</p>
            <p className="text-gray-900">{interviewRound.interviewer_name}</p>
          </div>
          {interviewRound.interviewer_linkedin_url && (
            <div className="flex gap-2">
              <a
                href={interviewRound.interviewer_linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                title="View LinkedIn profile"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <button
                onClick={handleCopyLinkedIn}
                className="p-2 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                title="Copy LinkedIn URL"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {interviewRound.question_types_expected && (
          <div>
            <p className="text-sm font-medium text-gray-700">Expected Topics</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{interviewRound.question_types_expected}</p>
          </div>
        )}

        {interviewRound.status === 'Completed' && (
          <>
            {interviewRound.actual_questions_asked && (
              <div>
                <p className="text-sm font-medium text-gray-700">Questions Asked</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{interviewRound.actual_questions_asked}</p>
              </div>
            )}

            {interviewRound.feedback_sentiment && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Feedback</p>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
                    sentimentConfig[interviewRound.feedback_sentiment as keyof typeof sentimentConfig]?.bg
                  } ${sentimentConfig[interviewRound.feedback_sentiment as keyof typeof sentimentConfig]?.text}`}
                >
                  {sentimentConfig[interviewRound.feedback_sentiment as keyof typeof sentimentConfig]?.emoji}
                  {interviewRound.feedback_sentiment}
                </span>
              </div>
            )}

            {interviewRound.feedback_notes && (
              <div>
                <p className="text-sm font-medium text-gray-700">Feedback Notes</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{interviewRound.feedback_notes}</p>
              </div>
            )}

            {interviewRound.learnings && (
              <div>
                <p className="text-sm font-medium text-gray-700">Key Learnings</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{interviewRound.learnings}</p>
              </div>
            )}
          </>
        )}

        {interviewRound.status === 'Cancelled' && interviewRound.cancellation_reason && (
          <div>
            <p className="text-sm font-medium text-gray-700">Cancellation Reason</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{interviewRound.cancellation_reason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
