import { useState, useEffect } from 'react';
import { X, Video, Phone, MapPin, FileText } from 'lucide-react';
import { interviewRoundsApi } from '../lib/api';
import type { InterviewRound } from '../lib/database.types';
import { INTERVIEW_ROUND_TYPES, INTERVIEW_ROUND_STATUSES, FEEDBACK_SENTIMENTS, MEETING_TYPES } from '../lib/database.types';
import { useToast } from '../contexts/ToastContext';

interface InterviewRoundFormProps {
  applicationId: string;
  interviewRound?: InterviewRound;
  onClose: () => void;
  onSuccess: () => void;
  suggestedRoundNumber?: number;
}

export default function InterviewRoundForm({
  applicationId,
  interviewRound,
  onClose,
  onSuccess,
  suggestedRoundNumber,
}: InterviewRoundFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    round_number: suggestedRoundNumber || 1,
    round_type: 'Phone Screen',
    status: 'Scheduled',
    interview_date: '',
    interviewer_name: '',
    interviewer_linkedin_url: '',
    meeting_type: '',
    meeting_link: '',
    meeting_phone: '',
    meeting_notes: '',
    question_types_expected: '',
    actual_questions_asked: '',
    feedback_sentiment: '',
    feedback_notes: '',
    learnings: '',
    cancellation_reason: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (interviewRound) {
      const date = new Date(interviewRound.interview_date);
      const formattedDate = date.toISOString().slice(0, 16);

      setFormData({
        round_number: interviewRound.round_number,
        round_type: interviewRound.round_type,
        status: interviewRound.status,
        interview_date: formattedDate,
        interviewer_name: interviewRound.interviewer_name,
        interviewer_linkedin_url: interviewRound.interviewer_linkedin_url,
        meeting_type: interviewRound.meeting_type || '',
        meeting_link: interviewRound.meeting_link || '',
        meeting_phone: interviewRound.meeting_phone || '',
        meeting_notes: interviewRound.meeting_notes || '',
        question_types_expected: interviewRound.question_types_expected,
        actual_questions_asked: interviewRound.actual_questions_asked,
        feedback_sentiment: interviewRound.feedback_sentiment,
        feedback_notes: interviewRound.feedback_notes,
        learnings: interviewRound.learnings,
        cancellation_reason: interviewRound.cancellation_reason,
      });
    }
  }, [interviewRound]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData.status === 'Completed') {
        if (!formData.actual_questions_asked && !formData.feedback_notes) {
          toast.warning('Please provide either questions asked or feedback notes for completed interviews.');
          setLoading(false);
          return;
        }
      }

      if (formData.status === 'Cancelled' && !formData.cancellation_reason) {
        toast.warning('Please provide a cancellation reason.');
        setLoading(false);
        return;
      }

      const interviewDate = new Date(formData.interview_date).toISOString();

      const roundData = {
        application_id: applicationId,
        round_number: formData.round_number,
        round_type: formData.round_type,
        status: formData.status,
        interview_date: interviewDate,
        interviewer_name: formData.interviewer_name,
        interviewer_linkedin_url: formData.interviewer_linkedin_url,
        meeting_type: formData.meeting_type,
        meeting_link: formData.meeting_link,
        meeting_phone: formData.meeting_phone,
        meeting_notes: formData.meeting_notes,
        question_types_expected: formData.question_types_expected,
        actual_questions_asked: formData.actual_questions_asked,
        feedback_sentiment: formData.feedback_sentiment,
        feedback_notes: formData.feedback_notes,
        learnings: formData.learnings,
        cancellation_reason: formData.cancellation_reason,
      };

      if (interviewRound) {
        await interviewRoundsApi.update(interviewRound.id, roundData);
        toast.success('Interview round updated successfully');
      } else {
        await interviewRoundsApi.create(roundData);
        toast.success('Interview round added successfully');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving interview round:', error);
      toast.error('Failed to save interview round. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {interviewRound ? 'Edit Interview Round' : 'Add Interview Round'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Round Number *</label>
              <input
                type="number"
                name="round_number"
                value={formData.round_number}
                onChange={handleChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Round Type *</label>
              <input
                type="text"
                name="round_type"
                value={formData.round_type}
                onChange={handleChange}
                list="round-type-suggestions"
                required
                placeholder="Select or type custom round type"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <datalist id="round-type-suggestions">
                {INTERVIEW_ROUND_TYPES.map((type) => (
                  <option key={type} value={type} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {INTERVIEW_ROUND_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interview Date & Time *</label>
              <input
                type="datetime-local"
                name="interview_date"
                value={formData.interview_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer Name *</label>
              <input
                type="text"
                name="interviewer_name"
                value={formData.interviewer_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewer LinkedIn URL
              </label>
              <input
                type="url"
                name="interviewer_linkedin_url"
                value={formData.interviewer_linkedin_url}
                onChange={handleChange}
                placeholder="https://linkedin.com/in/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Meeting Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Meeting Type</label>
                <select
                  name="meeting_type"
                  value={formData.meeting_type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select meeting type...</option>
                  {MEETING_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {(formData.meeting_type === 'Zoom' ||
                formData.meeting_type === 'Google Meet' ||
                formData.meeting_type === 'Microsoft Teams' ||
                formData.meeting_type === 'Other') && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Link
                  </label>
                  <div className="relative">
                    <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      name="meeting_link"
                      value={formData.meeting_link}
                      onChange={handleChange}
                      placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {formData.meeting_type === 'Phone Call' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      name="meeting_phone"
                      value={formData.meeting_phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {formData.meeting_type === 'In-Person' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location / Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      name="meeting_notes"
                      value={formData.meeting_notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Enter the office address or meeting location..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {formData.meeting_type && formData.meeting_type !== 'In-Person' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes / Access Codes
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      name="meeting_notes"
                      value={formData.meeting_notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Meeting password, dial-in instructions, or other details..."
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Question Types / Topics
            </label>
            <textarea
              name="question_types_expected"
              value={formData.question_types_expected}
              onChange={handleChange}
              rows={3}
              placeholder="e.g., Data structures, algorithms, system design..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {formData.status === 'Completed' && (
            <div className="space-y-6 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Completion Details</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Questions Asked
                </label>
                <textarea
                  name="actual_questions_asked"
                  value={formData.actual_questions_asked}
                  onChange={handleChange}
                  rows={4}
                  placeholder="List the questions you were asked..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Sentiment</label>
                <div className="flex gap-3">
                  {FEEDBACK_SENTIMENTS.map((sentiment) => (
                    <label key={sentiment} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="feedback_sentiment"
                        value={sentiment}
                        checked={formData.feedback_sentiment === sentiment}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{sentiment}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Feedback Notes</label>
                <textarea
                  name="feedback_notes"
                  value={formData.feedback_notes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="How did the interview go? Any feedback received?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Learnings</label>
                <textarea
                  name="learnings"
                  value={formData.learnings}
                  onChange={handleChange}
                  rows={3}
                  placeholder="What did you learn? What would you do differently?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {formData.status === 'Cancelled' && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Cancellation Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cancellation Reason *
                </label>
                <textarea
                  name="cancellation_reason"
                  value={formData.cancellation_reason}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Why was this interview cancelled?"
                  required={formData.status === 'Cancelled'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : interviewRound ? 'Update Round' : 'Add Round'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
