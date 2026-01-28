import { getWeekDays, isToday, isSameDay } from '../lib/calendar';
import type { CalendarEventType } from '../lib/api';
import { Calendar, Users } from 'lucide-react';

interface WeekViewProps {
  currentDate: Date;
  events: CalendarEventType[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEventType) => void;
}

export default function WeekView({ currentDate, events, onDateClick, onEventClick }: WeekViewProps) {
  const weekDays = getWeekDays(currentDate);

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const getEventColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'border-l-red-500 bg-red-50 hover:bg-red-100';
      case 'completed':
        return 'border-l-gray-400 bg-gray-50 hover:bg-gray-100';
      case 'cancelled':
        return 'border-l-amber-500 bg-amber-50 hover:bg-amber-100';
      default:
        return 'border-l-blue-500 bg-blue-50 hover:bg-blue-100';
    }
  };

  const getEventIcon = (type: string) => {
    return type === 'interview' ? <Calendar className="w-4 h-4" /> : <Users className="w-4 h-4" />;
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {weekDays.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          const isTodayDate = isToday(date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

          return (
            <div key={index} className="bg-white min-h-96">
              <div
                className={`p-3 text-center border-b ${
                  isTodayDate ? 'bg-blue-600 text-white' : 'bg-gray-50'
                }`}
              >
                <div className={`text-xs font-medium ${isTodayDate ? 'text-blue-100' : 'text-gray-600'}`}>
                  {dayName}
                </div>
                <div
                  className={`text-2xl font-bold mt-1 ${
                    isTodayDate ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {date.getDate()}
                </div>
                {dayEvents.length > 0 && (
                  <div className={`text-xs mt-1 ${isTodayDate ? 'text-blue-100' : 'text-gray-500'}`}>
                    {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                  </div>
                )}
              </div>

              <div className="p-2 space-y-2">
                {dayEvents.length === 0 ? (
                  <div
                    className="text-center py-8 text-gray-400 text-sm cursor-pointer hover:bg-gray-50 rounded"
                    onClick={() => onDateClick(date)}
                  >
                    No events
                  </div>
                ) : (
                  dayEvents.map(event => (
                    <div
                      key={event.id}
                      className={`p-3 rounded border-l-4 cursor-pointer transition-colors ${getEventColor(event.status)}`}
                      onClick={() => onEventClick(event)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="text-gray-600 mt-0.5">
                          {getEventIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {event.application.company_name}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {event.title}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {event.application.position_title}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
