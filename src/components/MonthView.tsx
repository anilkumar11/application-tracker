import { getMonthCalendarDays, isSameMonth, isToday, isSameDay } from '../lib/calendar';
import type { CalendarEventType } from '../lib/api';

interface MonthViewProps {
  currentDate: Date;
  events: CalendarEventType[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEventType) => void;
}

export default function MonthView({ currentDate, events, onDateClick, onEventClick }: MonthViewProps) {
  const days = getMonthCalendarDays(currentDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'bg-red-500';
      case 'completed':
        return 'bg-gray-400';
      case 'cancelled':
        return 'bg-amber-500';
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {dayNames.map(day => (
          <div key={day} className="bg-gray-50 px-2 py-3 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isCurrentMonth = isSameMonth(date, currentDate);
          const isTodayDate = isToday(date);

          return (
            <div
              key={index}
              className={`min-h-32 bg-white p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              }`}
              onClick={() => onDateClick(date)}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    !isCurrentMonth
                      ? 'text-gray-400'
                      : isTodayDate
                      ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                      : 'text-gray-900'
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-xs text-gray-500 font-medium">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs px-2 py-1 rounded text-white truncate hover:opacity-80 transition-opacity ${getEventColor(event.status)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    title={`${event.application.company_name} - ${event.title}`}
                  >
                    {event.type === 'interview' ? '📅' : '📌'} {event.application.company_name}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 pl-2">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
