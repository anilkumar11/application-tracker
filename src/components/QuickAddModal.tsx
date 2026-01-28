import { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { applicationApi, followUpApi, preferencesApi } from '../lib/api';
import { Autocomplete } from './Autocomplete';

interface QuickAddModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickAddModal({ onClose, onSuccess }: QuickAddModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [positionTitle, setPositionTitle] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoFollowUp, setAutoFollowUp] = useState(true);
  const [positionTitles, setPositionTitles] = useState<string[]>([]);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const prefs = await preferencesApi.get();
        if (prefs) {
          setPositionTitles(prefs.position_titles || []);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
    loadPreferences();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const applicationDate = new Date().toISOString().split('T')[0];
      const newApp = await applicationApi.create(
        {
          company_name: companyName,
          position_title: positionTitle,
          status: 'Applied',
          application_date: applicationDate,
          application_source: 'Direct',
          work_type: 'Hybrid',
          job_url: jobUrl,
          salary_range: '',
          location: '',
          documents_url: '',
          notes: '',
        },
        []
      );

      if (autoFollowUp && newApp) {
        await followUpApi.createAutoSuggestions(newApp.id, applicationDate);
      }

      if (positionTitle && !positionTitles.includes(positionTitle)) {
        await preferencesApi.addPositionTitle(positionTitle);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating application:', error);
      alert('Failed to create application. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Quick Add</h2>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Add an application quickly with just the essentials. You can add more details later.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              autoFocus
              placeholder="e.g., Google, Microsoft, Startup Inc"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <Autocomplete
              label="Position Title"
              value={positionTitle}
              onChange={setPositionTitle}
              suggestions={positionTitles}
              placeholder="e.g., Software Engineer, Product Manager"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job URL (optional)
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="quickAutoFollowUp"
              checked={autoFollowUp}
              onChange={(e) => setAutoFollowUp(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="quickAutoFollowUp" className="text-sm text-gray-700">
              Create follow-up reminders
            </label>
          </div>

          <div className="flex gap-3 pt-4">
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
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Application'}
            </button>
          </div>

          <p className="text-xs text-center text-gray-500 pt-2">
            Need more options? Close this and use the full form instead.
          </p>
        </form>
      </div>
    </div>
  );
}
