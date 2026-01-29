import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EditFollowUpModalProps {
  followUp: {
    id: string;
    scheduled_date: string;
    description: string;
  } | null;
  onClose: () => void;
  onSave: (id: string, data: { scheduled_date: string; description: string }) => Promise<void>;
}

export default function EditFollowUpModal({ followUp, onClose, onSave }: EditFollowUpModalProps) {
  const [scheduledDate, setScheduledDate] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (followUp) {
      setScheduledDate(followUp.scheduled_date);
      setDescription(followUp.description);
    }
  }, [followUp]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!followUp) return;

    setSaving(true);
    try {
      await onSave(followUp.id, {
        scheduled_date: scheduledDate,
        description,
      });
      onClose();
    } catch (error) {
      console.error('Error saving follow-up:', error);
    } finally {
      setSaving(false);
    }
  }

  if (!followUp) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">Edit Follow-up</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">
              Scheduled Date
            </label>
            <input
              type="date"
              id="scheduled_date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What needs to be followed up on?"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
