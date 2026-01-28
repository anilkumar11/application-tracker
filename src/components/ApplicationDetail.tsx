import { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Briefcase,
  Calendar,
  DollarSign,
  ExternalLink,
  Users,
  Clock,
  Trash2,
  Plus,
  CheckCircle,
  Phone,
  Mail,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { ApplicationWithRelations, ApplicationStatus, InterviewRound } from '../lib/database.types';
import StatusBadge from './StatusBadge';
import { applicationApi, followUpApi, interviewRoundsApi } from '../lib/api';
import InterviewRoundCard from './InterviewRoundCard';
import InterviewRoundForm from './InterviewRoundForm';
import { useToast } from '../contexts/ToastContext';

interface ApplicationDetailProps {
  application: ApplicationWithRelations;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

export default function ApplicationDetail({
  application,
  onClose,
  onEdit,
  onRefresh,
}: ApplicationDetailProps) {
  const toast = useToast();
  const [currentApplication, setCurrentApplication] = useState<ApplicationWithRelations>(application);
  const [showAddFollowUp, setShowAddFollowUp] = useState(false);
  const [newFollowUp, setNewFollowUp] = useState({
    scheduled_date: '',
    description: '',
  });
  const [deleting, setDeleting] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [editingRound, setEditingRound] = useState<InterviewRound | undefined>();
  const [suggestedRoundNumber, setSuggestedRoundNumber] = useState(1);
  const [showScheduled, setShowScheduled] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showCancelled, setShowCancelled] = useState(false);

  useEffect(() => {
    setCurrentApplication(application);
  }, [application]);

  async function refreshApplicationData() {
    try {
      const updatedApp = await applicationApi.getById(currentApplication.id);
      if (updatedApp) {
        setCurrentApplication(updatedApp as ApplicationWithRelations);
      }
    } catch (error) {
      console.error('Error refreshing application data:', error);
      toast.error('Failed to refresh application data');
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await applicationApi.delete(currentApplication.id);
      toast.success('Application deleted successfully');
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast.error('Failed to delete application. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddFollowUp(e: React.FormEvent) {
    e.preventDefault();
    try {
      await followUpApi.create({
        application_id: currentApplication.id,
        ...newFollowUp,
      });
      setNewFollowUp({ scheduled_date: '', description: '' });
      setShowAddFollowUp(false);
      toast.success('Follow-up added successfully');
      await refreshApplicationData();
      onRefresh();
    } catch (error) {
      console.error('Error adding follow-up:', error);
      toast.error('Failed to add follow-up');
    }
  }

  async function handleCompleteFollowUp(id: string) {
    try {
      await followUpApi.complete(id);
      toast.success('Follow-up marked as complete');
      await refreshApplicationData();
      onRefresh();
    } catch (error) {
      console.error('Error completing follow-up:', error);
      toast.error('Failed to complete follow-up');
    }
  }

  async function handleAddInterviewRound() {
    const nextNumber = await interviewRoundsApi.getNextRoundNumber(currentApplication.id);
    setSuggestedRoundNumber(nextNumber);
    setEditingRound(undefined);
    setShowInterviewForm(true);
  }

  function handleEditRound(round: InterviewRound) {
    setEditingRound(round);
    setShowInterviewForm(true);
  }

  async function handleDeleteRound(id: string) {
    try {
      await interviewRoundsApi.delete(id);
      toast.success('Interview round deleted successfully');
      await refreshApplicationData();
      onRefresh();
    } catch (error) {
      console.error('Error deleting interview round:', error);
      toast.error('Failed to delete interview round');
    }
  }

  function handleMarkComplete(round: InterviewRound) {
    setEditingRound({ ...round, status: 'Completed' });
    setShowInterviewForm(true);
  }

  async function handleReschedule(round: InterviewRound) {
    const nextNumber = await interviewRoundsApi.getNextRoundNumber(currentApplication.id);
    const newRound: Partial<InterviewRound> = {
      round_number: nextNumber,
      round_type: round.round_type,
      status: 'Scheduled',
      interview_date: new Date().toISOString(),
      interviewer_name: round.interviewer_name,
      interviewer_linkedin_url: round.interviewer_linkedin_url,
      question_types_expected: round.question_types_expected,
      actual_questions_asked: '',
      feedback_sentiment: '',
      feedback_notes: '',
      learnings: '',
      cancellation_reason: '',
    };
    setEditingRound(newRound as InterviewRound);
    setShowInterviewForm(true);
  }

  async function handleInterviewFormSuccess() {
    setShowInterviewForm(false);
    setEditingRound(undefined);
    await refreshApplicationData();
    onRefresh();
  }

  const sortedHistory = currentApplication.status_history?.sort(
    (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
  );

  const sortedFollowUps = currentApplication.follow_ups?.sort(
    (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{currentApplication.company_name}</h2>
            <p className="text-gray-700 font-medium">{currentApplication.position_title}</p>
          </div>
          <StatusBadge status={currentApplication.status as ApplicationStatus} />
          <button onClick={onClose} className="ml-4 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Applied On</p>
                <p className="font-medium">
                  {new Date(currentApplication.application_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Work Type</p>
                <p className="font-medium">{currentApplication.work_type}</p>
              </div>
            </div>

            {currentApplication.location && (
              <div className="flex items-center gap-3 text-gray-700">
                <MapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{currentApplication.location}</p>
                </div>
              </div>
            )}

            {currentApplication.salary_range && (
              <div className="flex items-center gap-3 text-gray-700">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Salary Range</p>
                  <p className="font-medium">{currentApplication.salary_range}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-gray-700">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Application Source</p>
                <p className="font-medium">{currentApplication.application_source}</p>
              </div>
            </div>
          </div>

          {(currentApplication.job_url || currentApplication.documents_url) && (
            <div className="space-y-2 pt-4 border-t border-gray-200">
              {currentApplication.job_url && (
                <a
                  href={currentApplication.job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Job Posting
                </a>
              )}
              {currentApplication.documents_url && (
                <a
                  href={currentApplication.documents_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Application Documents
                </a>
              )}
            </div>
          )}

          {currentApplication.notes && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{currentApplication.notes}</p>
            </div>
          )}

          {currentApplication.referrals && currentApplication.referrals.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Referrals</h3>
              <div className="space-y-3">
                {currentApplication.referrals.map((referral) => (
                  <div key={referral.id} className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{referral.name}</p>
                    {referral.relationship && (
                      <p className="text-sm text-gray-600">{referral.relationship}</p>
                    )}
                    {referral.contact_info && (
                      <p className="text-sm text-gray-600">{referral.contact_info}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(currentApplication.ta_contact_name || currentApplication.hr_coordinator_name) && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Recruiting Contacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentApplication.ta_contact_name && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">TA / Recruiter</p>
                    <p className="font-medium text-gray-900">{currentApplication.ta_contact_name}</p>
                    {currentApplication.ta_contact_phone && (
                      <div className="flex items-center gap-2 mt-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <a
                          href={`tel:${currentApplication.ta_contact_phone}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {currentApplication.ta_contact_phone}
                        </a>
                      </div>
                    )}
                    {currentApplication.ta_contact_email && (
                      <div className="flex items-center gap-2 mt-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <a
                          href={`mailto:${currentApplication.ta_contact_email}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {currentApplication.ta_contact_email}
                        </a>
                      </div>
                    )}
                  </div>
                )}
                {currentApplication.hr_coordinator_name && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">HR Coordinator</p>
                    <p className="font-medium text-gray-900">{currentApplication.hr_coordinator_name}</p>
                    {currentApplication.hr_coordinator_phone && (
                      <div className="flex items-center gap-2 mt-2">
                        <Phone className="w-4 h-4 text-blue-600" />
                        <a
                          href={`tel:${currentApplication.hr_coordinator_phone}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {currentApplication.hr_coordinator_phone}
                        </a>
                      </div>
                    )}
                    {currentApplication.hr_coordinator_email && (
                      <div className="flex items-center gap-2 mt-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <a
                          href={`mailto:${currentApplication.hr_coordinator_email}`}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {currentApplication.hr_coordinator_email}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Interview Rounds</h3>
              <button
                onClick={handleAddInterviewRound}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Interview Round
              </button>
            </div>

            {currentApplication.interview_rounds && currentApplication.interview_rounds.length > 0 ? (
              <div className="space-y-4">
                {(() => {
                  const scheduled = currentApplication.interview_rounds.filter(r => r.status === 'Scheduled').sort(
                    (a, b) => new Date(a.interview_date).getTime() - new Date(b.interview_date).getTime()
                  );
                  const completed = currentApplication.interview_rounds.filter(r => r.status === 'Completed').sort(
                    (a, b) => new Date(b.interview_date).getTime() - new Date(a.interview_date).getTime()
                  );
                  const cancelled = currentApplication.interview_rounds.filter(r => r.status === 'Cancelled').sort(
                    (a, b) => new Date(b.interview_date).getTime() - new Date(a.interview_date).getTime()
                  );

                  const totalCompleted = completed.length;
                  const totalRounds = currentApplication.interview_rounds.length;

                  return (
                    <>
                      {totalRounds > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <p className="text-sm text-gray-700">
                            Progress: <span className="font-semibold">{totalCompleted} of {totalRounds}</span> rounds completed
                          </p>
                        </div>
                      )}

                      {scheduled.length > 0 && (
                        <div>
                          <button
                            onClick={() => setShowScheduled(!showScheduled)}
                            className="flex items-center gap-2 text-blue-700 font-medium mb-2 hover:text-blue-800"
                          >
                            {showScheduled ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Upcoming Scheduled ({scheduled.length})
                          </button>
                          {showScheduled && (
                            <div className="space-y-3">
                              {scheduled.map((round) => (
                                <InterviewRoundCard
                                  key={round.id}
                                  interviewRound={round}
                                  companyName={currentApplication.company_name}
                                  positionTitle={currentApplication.position_title}
                                  onEdit={handleEditRound}
                                  onDelete={handleDeleteRound}
                                  onMarkComplete={handleMarkComplete}
                                  onReschedule={handleReschedule}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {completed.length > 0 && (
                        <div>
                          <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="flex items-center gap-2 text-green-700 font-medium mb-2 hover:text-green-800"
                          >
                            {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Completed ({completed.length})
                          </button>
                          {showCompleted && (
                            <div className="space-y-3">
                              {completed.map((round) => (
                                <InterviewRoundCard
                                  key={round.id}
                                  interviewRound={round}
                                  companyName={currentApplication.company_name}
                                  positionTitle={currentApplication.position_title}
                                  onEdit={handleEditRound}
                                  onDelete={handleDeleteRound}
                                  onMarkComplete={handleMarkComplete}
                                  onReschedule={handleReschedule}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {cancelled.length > 0 && (
                        <div>
                          <button
                            onClick={() => setShowCancelled(!showCancelled)}
                            className="flex items-center gap-2 text-red-700 font-medium mb-2 hover:text-red-800"
                          >
                            {showCancelled ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Cancelled ({cancelled.length})
                          </button>
                          {showCancelled && (
                            <div className="space-y-3">
                              {cancelled.map((round) => (
                                <InterviewRoundCard
                                  key={round.id}
                                  interviewRound={round}
                                  companyName={currentApplication.company_name}
                                  positionTitle={currentApplication.position_title}
                                  onEdit={handleEditRound}
                                  onDelete={handleDeleteRound}
                                  onMarkComplete={handleMarkComplete}
                                  onReschedule={handleReschedule}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No interview rounds scheduled</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Follow-ups</h3>
              <button
                onClick={() => setShowAddFollowUp(!showAddFollowUp)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Follow-up
              </button>
            </div>

            {showAddFollowUp && (
              <form onSubmit={handleAddFollowUp} className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={newFollowUp.scheduled_date}
                      onChange={(e) =>
                        setNewFollowUp({ ...newFollowUp, scheduled_date: e.target.value })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={newFollowUp.description}
                      onChange={(e) =>
                        setNewFollowUp({ ...newFollowUp, description: e.target.value })
                      }
                      required
                      placeholder="e.g., Follow up on application"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddFollowUp(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {sortedFollowUps && sortedFollowUps.length > 0 ? (
              <div className="space-y-2">
                {sortedFollowUps.map((followUp) => {
                  const isOverdue =
                    !followUp.completed &&
                    new Date(followUp.scheduled_date) < new Date(new Date().toDateString());
                  return (
                    <div
                      key={followUp.id}
                      className={`p-4 rounded-lg border ${
                        followUp.completed
                          ? 'bg-gray-50 border-gray-200'
                          : isOverdue
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {followUp.completed && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                            <p
                              className={`font-medium ${
                                followUp.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                              }`}
                            >
                              {followUp.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <p
                              className={`text-sm ${
                                isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'
                              }`}
                            >
                              {new Date(followUp.scheduled_date).toLocaleDateString()}
                              {isOverdue && ' (Overdue)'}
                            </p>
                          </div>
                          {followUp.auto_generated && (
                            <p className="text-xs text-gray-500 mt-1">Auto-generated</p>
                          )}
                        </div>
                        {!followUp.completed && (
                          <button
                            onClick={() => handleCompleteFollowUp(followUp.id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No follow-ups scheduled</p>
            )}
          </div>

          {sortedHistory && sortedHistory.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Status History</h3>
              <div className="space-y-3">
                {sortedHistory.map((history, index) => (
                  <div key={history.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                      {index < sortedHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <StatusBadge status={history.status as ApplicationStatus} size="sm" />
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(history.changed_at).toLocaleString()}
                      </p>
                      {history.notes && <p className="text-sm text-gray-700 mt-1">{history.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Application
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showInterviewForm && (
        <InterviewRoundForm
          applicationId={currentApplication.id}
          interviewRound={editingRound}
          onClose={() => {
            setShowInterviewForm(false);
            setEditingRound(undefined);
          }}
          onSuccess={handleInterviewFormSuccess}
          suggestedRoundNumber={suggestedRoundNumber}
        />
      )}
    </div>
  );
}
