import { useEffect, useState } from 'react';
import { Briefcase, Phone, Award, XCircle, Clock, AlertCircle, Calendar, Download } from 'lucide-react';
import { applicationApi, followUpApi, interviewRoundsApi } from '../lib/api';
import StatsCard from './StatsCard';
import { downloadInterviewCalendar, formatRelativeTime, getDayLabel, getUrgencyLevel } from '../lib/calendar';

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

interface InterviewWithApp {
  id: string;
  round_number: number;
  round_type: string;
  interview_date: string;
  interviewer_name: string;
  interviewer_linkedin_url: string;
  question_types_expected: string;
  applications: {
    id: string;
    company_name: string;
    position_title: string;
  };
}

interface DashboardOverviewProps {
  refreshTrigger?: number;
}

export default function DashboardOverview({ refreshTrigger }: DashboardOverviewProps) {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    applied: 0,
    interviewing: 0,
    offers: 0,
    rejected: 0,
  });
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<FollowUpWithApp[]>([]);
  const [overdueFollowUps, setOverdueFollowUps] = useState<FollowUpWithApp[]>([]);
  const [next7DaysEvents, setNext7DaysEvents] = useState<InterviewWithApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  async function loadData() {
    try {
      const [statsData, upcoming, overdue, interviews] = await Promise.all([
        applicationApi.getStats(),
        followUpApi.getUpcoming(),
        followUpApi.getOverdue(),
        interviewRoundsApi.getNext7Days(),
      ]);
      setStats(statsData);
      setUpcomingFollowUps(upcoming);
      setOverdueFollowUps(overdue);
      setNext7DaysEvents(interviews as InterviewWithApp[]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCompleteFollowUp(id: string) {
    try {
      await followUpApi.complete(id);
      loadData();
    } catch (error) {
      console.error('Error completing follow-up:', error);
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
        <h2 className="text-2xl font-bold text-gray-900">Overview</h2>
        <p className="text-gray-600 mt-1">Track your job application progress at a glance</p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex lg:grid lg:grid-cols-5 gap-4 min-w-max lg:min-w-0">
          <div className="w-64 lg:w-auto">
            <StatsCard title="Total Applications" value={stats.total} icon={Briefcase} color="bg-blue-600" />
          </div>
          <div className="w-64 lg:w-auto">
            <StatsCard title="Applied" value={stats.applied} icon={Clock} color="bg-gray-600" />
          </div>
          <div className="w-64 lg:w-auto">
            <StatsCard title="Interviewing" value={stats.interviewing} icon={Phone} color="bg-orange-600" />
          </div>
          <div className="w-64 lg:w-auto">
            <StatsCard title="Offers" value={stats.offers} icon={Award} color="bg-green-600" />
          </div>
          <div className="w-64 lg:w-auto">
            <StatsCard title="Rejected" value={stats.rejected} icon={XCircle} color="bg-red-600" />
          </div>
        </div>
      </div>

      {overdueFollowUps.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 animate-pulse shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Overdue Follow-ups</h3>
          </div>
          <div className="space-y-2">
            {overdueFollowUps.map((followUp) => (
              <div key={followUp.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm hover:shadow-md transition-all duration-200">
                <div>
                  <p className="font-medium text-gray-900">
                    {followUp.applications.company_name} - {followUp.applications.position_title}
                  </p>
                  <p className="text-sm text-gray-600">{followUp.description}</p>
                  <p className="text-xs text-red-600 mt-1 font-semibold">Due: {new Date(followUp.scheduled_date).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleCompleteFollowUp(followUp.id)}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md"
                >
                  Complete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingFollowUps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Follow-ups</h3>
          <div className="space-y-2">
            {upcomingFollowUps.slice(0, 5).map((followUp) => (
              <div key={followUp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-blue-50 hover:shadow-sm transition-all duration-200">
                <div>
                  <p className="font-medium text-gray-900">
                    {followUp.applications.company_name} - {followUp.applications.position_title}
                  </p>
                  <p className="text-sm text-gray-600">{followUp.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(followUp.scheduled_date).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleCompleteFollowUp(followUp.id)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md"
                >
                  Complete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingFollowUps.length === 0 && overdueFollowUps.length === 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-8 text-center shadow-sm">
          <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Clock className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">All caught up!</h3>
          <p className="text-gray-600">No follow-ups scheduled at the moment</p>
        </div>
      )}

      {next7DaysEvents.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-4 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">Next 7 Days - Interviews</h3>
          </div>
          <div className="space-y-3">
            {next7DaysEvents.map((interview) => {
              const urgency = getUrgencyLevel(interview.interview_date);
              const dayLabel = getDayLabel(interview.interview_date);
              const urgencyColors = {
                high: 'border-red-300 bg-red-50',
                medium: 'border-orange-300 bg-orange-50',
                low: 'border-green-300 bg-green-50',
              };
              const urgencyBadgeColors = {
                high: 'bg-red-100 text-red-800',
                medium: 'bg-orange-100 text-orange-800',
                low: 'bg-green-100 text-green-800',
              };

              return (
                <div
                  key={interview.id}
                  className={`border-2 ${urgencyColors[urgency]} rounded-lg p-4 hover:shadow-md transition-all duration-200`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-xs font-bold rounded-full">
                          {interview.round_number}
                        </span>
                        <p className="font-semibold text-gray-900">
                          {interview.applications.company_name} - {interview.applications.position_title}
                        </p>
                        {dayLabel && (
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${urgencyBadgeColors[urgency]}`}>
                            {dayLabel}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">{interview.round_type}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(interview.interview_date)}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(interview.interview_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {interview.interviewer_name && (
                        <p className="text-xs text-gray-600 mt-1">
                          Interviewer: <span className="font-medium">{interview.interviewer_name}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => downloadInterviewCalendar(interview as any, interview.applications.company_name, interview.applications.position_title)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md"
                        title="Add to calendar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {next7DaysEvents.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-blue-900 font-medium">No interviews in the next 7 days</p>
          <p className="text-xs text-blue-700">Check back here when you schedule an interview</p>
        </div>
      )}
    </div>
  );
}
