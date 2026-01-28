import { useState, useEffect } from 'react';
import { X, Plus, Trash2, ChevronDown, ChevronUp, Copy, Link } from 'lucide-react';
import { applicationApi, followUpApi, preferencesApi } from '../lib/api';
import type { ApplicationWithRelations } from '../lib/database.types';
import { APPLICATION_STATUSES, APPLICATION_SOURCES, WORK_TYPES } from '../lib/database.types';
import { parseJobUrl } from '../lib/urlParser';
import DatePresets from './DatePresets';
import { Autocomplete } from './Autocomplete';

interface ApplicationFormProps {
  application?: ApplicationWithRelations;
  onClose: () => void;
  onSuccess: () => void;
  recentApplications?: ApplicationWithRelations[];
}

interface ReferralInput {
  name: string;
  relationship: string;
  contact_info: string;
}

export default function ApplicationForm({ application, onClose, onSuccess, recentApplications = [] }: ApplicationFormProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    position_title: '',
    status: 'Applied',
    application_date: new Date().toISOString().split('T')[0],
    application_source: 'Direct',
    salary_range: '',
    job_url: '',
    location: '',
    work_type: 'Hybrid',
    documents_url: '',
    notes: '',
    ta_contact_name: '',
    ta_contact_phone: '',
    ta_contact_email: '',
    hr_coordinator_name: '',
    hr_coordinator_phone: '',
    hr_coordinator_email: '',
  });

  const [referrals, setReferrals] = useState<ReferralInput[]>([]);
  const [autoFollowUp, setAutoFollowUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showReferrals, setShowReferrals] = useState(false);
  const [showCopyOptions, setShowCopyOptions] = useState(false);
  const [customFollowUpDate, setCustomFollowUpDate] = useState('');
  const [positionTitles, setPositionTitles] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    if (application) {
      setFormData({
        company_name: application.company_name,
        position_title: application.position_title,
        status: application.status,
        application_date: application.application_date,
        application_source: application.application_source,
        salary_range: application.salary_range,
        job_url: application.job_url,
        location: application.location,
        work_type: application.work_type,
        documents_url: application.documents_url,
        notes: application.notes,
        ta_contact_name: application.ta_contact_name,
        ta_contact_phone: application.ta_contact_phone,
        ta_contact_email: application.ta_contact_email,
        hr_coordinator_name: application.hr_coordinator_name,
        hr_coordinator_phone: application.hr_coordinator_phone,
        hr_coordinator_email: application.hr_coordinator_email,
      });
      if (application.referrals && application.referrals.length > 0) {
        setReferrals(
          application.referrals.map((ref) => ({
            name: ref.name,
            relationship: ref.relationship,
            contact_info: ref.contact_info,
          }))
        );
      }
      setAutoFollowUp(false);
    }
  }, [application]);

  useEffect(() => {
    if (formData.application_source === 'Referral' && referrals.length === 0) {
      setReferrals([{ name: '', relationship: '', contact_info: '' }]);
      setShowReferrals(true);
    }
  }, [formData.application_source]);

  useEffect(() => {
    if (application) {
      setShowAdvanced(true);
    }
  }, [application]);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const prefs = await preferencesApi.get();
        if (prefs) {
          setPositionTitles(prefs.position_titles || []);
          setLocations(prefs.locations || []);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
    loadPreferences();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  function addReferral() {
    setReferrals((prev) => [...prev, { name: '', relationship: '', contact_info: '' }]);
  }

  function removeReferral(index: number) {
    setReferrals((prev) => prev.filter((_, i) => i !== index));
  }

  function updateReferral(index: number, field: keyof ReferralInput, value: string) {
    setReferrals((prev) =>
      prev.map((ref, i) => (i === index ? { ...ref, [field]: value } : ref))
    );
  }

  function handleUrlParse() {
    if (!formData.job_url) return;

    const parsed = parseJobUrl(formData.job_url);

    if (parsed.company || parsed.position || parsed.location) {
      setFormData((prev) => ({
        ...prev,
        ...(parsed.company && !prev.company_name ? { company_name: parsed.company } : {}),
        ...(parsed.position && !prev.position_title ? { position_title: parsed.position } : {}),
        ...(parsed.location && !prev.location ? { location: parsed.location } : {}),
      }));
    }
  }

  function copyFromApplication(app: ApplicationWithRelations) {
    setFormData((prev) => ({
      ...prev,
      application_source: app.application_source,
      work_type: app.work_type,
      location: app.location,
      salary_range: app.salary_range,
    }));
    setShowCopyOptions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (application) {
        await applicationApi.update(application.id, formData);
      } else {
        const validReferrals = referrals.filter((ref) => ref.name.trim() !== '');
        const newApp = await applicationApi.create(formData, validReferrals);

        if (autoFollowUp && newApp) {
          await followUpApi.createAutoSuggestions(newApp.id, formData.application_date);
        }
      }

      if (formData.position_title && !positionTitles.includes(formData.position_title)) {
        await preferencesApi.addPositionTitle(formData.position_title);
      }

      if (formData.location && !locations.includes(formData.location)) {
        await preferencesApi.addLocation(formData.location);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving application:', error);
      alert('Failed to save application. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {application ? 'Edit Application' : 'Add New Application'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!application && recentApplications.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <button
                type="button"
                onClick={() => setShowCopyOptions(!showCopyOptions)}
                className="flex items-center gap-2 text-sm font-medium text-blue-700 hover:text-blue-800"
              >
                <Copy className="w-4 h-4" />
                Copy details from a previous application
                {showCopyOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showCopyOptions && (
                <div className="mt-3 space-y-2">
                  {recentApplications.slice(0, 5).map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => copyFromApplication(app)}
                      className="w-full text-left px-3 py-2 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">{app.company_name}</div>
                      <div className="text-sm text-gray-600">{app.position_title} • {app.location}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <Autocomplete
                label="Position Title"
                name="position_title"
                value={formData.position_title}
                onChange={(value) => setFormData(prev => ({ ...prev, position_title: value }))}
                suggestions={positionTitles}
                required
              />
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
                {APPLICATION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Date *
              </label>
              <input
                type="date"
                name="application_date"
                value={formData.application_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Source *
              </label>
              <select
                name="application_source"
                value={formData.application_source}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {APPLICATION_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Type *</label>
              <select
                name="work_type"
                value={formData.work_type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {WORK_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Autocomplete
                label="Location"
                name="location"
                value={formData.location}
                onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                suggestions={locations}
                placeholder="e.g., San Francisco, CA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range</label>
              <input
                type="text"
                name="salary_range"
                value={formData.salary_range}
                onChange={handleChange}
                placeholder="e.g., $120k - $150k"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Job URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  name="job_url"
                  value={formData.job_url}
                  onChange={handleChange}
                  onBlur={handleUrlParse}
                  placeholder="https://..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.job_url && (
                  <button
                    type="button"
                    onClick={handleUrlParse}
                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                    title="Auto-fill from URL"
                  >
                    <Link className="w-4 h-4" />
                    Parse
                  </button>
                )}
              </div>
              {formData.job_url && (
                <p className="text-xs text-gray-500 mt-1">
                  Paste a job URL and we'll try to auto-fill details
                </p>
              )}
            </div>

          </div>

          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAdvanced ? 'Hide' : 'Show'} additional details
            </button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Documents URL
                </label>
                <input
                  type="url"
                  name="documents_url"
                  value={formData.documents_url}
                  onChange={handleChange}
                  placeholder="Link to resume, cover letter, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Any additional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 pt-4 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Recruiting Contacts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TA / Recruiter Name
                    </label>
                    <input
                      type="text"
                      name="ta_contact_name"
                      value={formData.ta_contact_name}
                      onChange={handleChange}
                      placeholder="Jane Smith"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TA / Recruiter Phone
                    </label>
                    <input
                      type="tel"
                      name="ta_contact_phone"
                      value={formData.ta_contact_phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TA / Recruiter Email
                    </label>
                    <input
                      type="email"
                      name="ta_contact_email"
                      value={formData.ta_contact_email}
                      onChange={handleChange}
                      placeholder="jane.smith@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HR Coordinator Name
                    </label>
                    <input
                      type="text"
                      name="hr_coordinator_name"
                      value={formData.hr_coordinator_name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HR Coordinator Phone
                    </label>
                    <input
                      type="tel"
                      name="hr_coordinator_phone"
                      value={formData.hr_coordinator_phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 987-6543"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      HR Coordinator Email
                    </label>
                    <input
                      type="email"
                      name="hr_coordinator_email"
                      value={formData.hr_coordinator_email}
                      onChange={handleChange}
                      placeholder="john.doe@company.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setShowReferrals(!showReferrals)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {showReferrals ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showReferrals ? 'Hide' : 'Add'} referrals {formData.application_source === 'Referral' && '(recommended)'}
            </button>
          </div>

          {showReferrals && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Referrals</h3>
                <button
                  type="button"
                  onClick={addReferral}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Referral
                </button>
              </div>

              {referrals.map((referral, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={referral.name}
                      onChange={(e) => updateReferral(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      value={referral.relationship}
                      onChange={(e) => updateReferral(index, 'relationship', e.target.value)}
                      placeholder="e.g., Former colleague"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Info
                      </label>
                      <input
                        type="text"
                        value={referral.contact_info}
                        onChange={(e) => updateReferral(index, 'contact_info', e.target.value)}
                        placeholder="Email or phone"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {referrals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeReferral(index)}
                        className="mt-7 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!application && (
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoFollowUp"
                  checked={autoFollowUp}
                  onChange={(e) => setAutoFollowUp(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoFollowUp" className="text-sm text-gray-700">
                  Automatically create follow-up reminders (7 and 14 days)
                </label>
              </div>

              {autoFollowUp && (
                <div className="ml-6 space-y-3">
                  <DatePresets
                    onSelectDate={setCustomFollowUpDate}
                    selectedDate={customFollowUpDate}
                  />
                  {customFollowUpDate && (
                    <p className="text-xs text-gray-600">
                      Custom reminder set for {new Date(customFollowUpDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
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
              {loading ? 'Saving...' : application ? 'Update Application' : 'Add Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
