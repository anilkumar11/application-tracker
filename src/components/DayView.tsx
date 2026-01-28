import { isSameDay } from '../lib/calendar';
import type { CalendarEventType } from '../lib/api';
import { Calendar, Users, Clock, Briefcase, MapPin } from 'lucide-react';

interface DayViewProps {
  currentDate: Date;
  events: CalendarEventType[];
  onEventClick: (event: CalendarEventType) => void;
}

export default function DayView({ currentDate, events, onEventClick }: DayViewProps) {
  const dayEvents = events.filter(event => isSameDay(new Date(event.date), currentDate));

  const getEventColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'border-l-red-500 bg-red-50';
      case 'completed':
        return 'border-l-gray-400 bg-gray-100';
      case 'cancelled':
        return 'border-l-amber-500 bg-amber-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">Overdue</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-800 rounded">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Scheduled</span>;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    if (hours === 0 && minutes === 0) {
      return 'All Day';
    }
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </h2>
            <p className="text-gray-600 mt-1">
              {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{dayEvents.length}</div>
            <div className="text-sm text-gray-500">{dayEvents.length === 1 ? 'Event' : 'Events'}</div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {dayEvents.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No events scheduled for this day</p>
            <p className="text-gray-400 text-sm mt-2">Your day is free!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${getEventColor(event.status)}`}
                onClick={() => onEventClick(event)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      {event.type === 'interview' ? (
                        <Calendar className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Users className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                        {event.type === 'interview' ? 'Interview' : 'Follow-up'}
                      </div>
                      <div className="font-semibold text-gray-900 text-lg">
                        {event.application.company_name}
                      </div>
                    </div>
                  </div>
                  {getStatusBadge(event.status)}
                </div>

                <div className="space-y-2 ml-14">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{event.application.position_title}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{formatTime(event.date)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{event.title}</span>
                  </div>

                  {event.metadata?.interviewer_name && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Interviewer:</span> {event.metadata.interviewer_name}
                      </p>
                    </div>
                  )}

                  {event.metadata?.round_number && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-white text-xs font-medium text-gray-700 rounded border border-gray-200">
                        Round {event.metadata.round_number}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
