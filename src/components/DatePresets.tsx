import { Calendar } from 'lucide-react';

interface DatePresetsProps {
  onSelectDate: (date: string) => void;
  selectedDate?: string;
}

export default function DatePresets({ onSelectDate, selectedDate }: DatePresetsProps) {
  const presets = [
    { label: 'Tomorrow', days: 1 },
    { label: '3 days', days: 3 },
    { label: '1 week', days: 7 },
    { label: '2 weeks', days: 14 },
    { label: '1 month', days: 30 },
  ];

  function getDateFromDays(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Quick select:</label>
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const dateValue = getDateFromDays(preset.days);
          const isSelected = selectedDate === dateValue;

          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSelectDate(dateValue)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
              }`}
            >
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {preset.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
