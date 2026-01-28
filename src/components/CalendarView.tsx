import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, X } from 'lucide-react';
import { calendarApi, type CalendarEventType } from '../lib/api';
import { applicationApi } from '../lib/api';
import type { ApplicationWithRelations } from '../lib/database.types';
import {
  formatMonthYear,
  formatWeekRange,
  addDays,
  addWeeks,
  addMonths,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfWeek,
  getEndOfWeek,
} from '../lib/calendar';
import MonthView from './MonthView';
import WeekView from './WeekView';
import DayView from './DayView';
import ApplicationDetail from './ApplicationDetail';

type ViewMode = 'day' | 'week' | 'month';

interface CalendarViewProps {
  refreshTrigger?: number;
}

export default function CalendarView({ refreshTrigger }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventType | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithRelations | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState({
    followUps: true,
    interviews: true,
  });
  const [statusFilter, setStatusFilter] = useState({
    scheduled: true,
    completed: true,
    overdue: true,
    cancelled: true,
  });

  useEffect(() => {
    loadEvents();
  }, [refreshTrigger]);

  async function loadEvents() {
    try {
      setLoading(true);
      const allEvents = await calendarApi.getAllEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredEvents = events.filter(event => {
    if (!eventTypeFilter.followUps && event.type === 'follow-up') return false;
    if (!eventTypeFilter.interviews && event.type === 'interview') return false;
    if (!statusFilter[event.status]) return false;
    return true;
  });

  const handlePrevious = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, -1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, -1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, -1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setCurrentDate(date);
    setViewMode('day');
  };

  const handleEventClick = async (event: CalendarEventType) => {
    setSelectedEvent(event);
    try {
      const application = await applicationApi.getById(event.application.id);
      if (application) {
        setSelectedApplication(application);
      }
    } catch (error) {
      console.error('Error loading application:', error);
    }
  };

  const handleCloseDetail = () => {
    setSelectedEvent(null);
    setSelectedApplication(null);
  };

  const handleRefresh = () => {
    loadEvents();
  };

  const getDateRangeText = () => {
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      case 'week':
        return formatWeekRange(currentDate);
      case 'month':
        return formatMonthYear(currentDate);
    }
  };

  const getVisibleEvents = () => {
    let start: Date, end: Date;

    switch (viewMode) {
      case 'day':
        start = new Date(currentDate);
        start.setHours(0, 0, 0, 0);
        end = new Date(currentDate);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start = getStartOfWeek(currentDate);
        end = getEndOfWeek(currentDate);
        break;
      case 'month':
        start = getStartOfMonth(currentDate);
        end = getEndOfMonth(currentDate);
        start.setDate(start.getDate() - 7);
        end.setDate(end.getDate() + 14);
        break;
    }

    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= start && eventDate <= end;
    });
  };

  const visibleEvents = getVisibleEvents();

  const eventCounts = {
    total: visibleEvents.length,
    followUps: visibleEvents.filter(e => e.type === 'follow-up').length,
    interviews: visibleEvents.filter(e => e.type === 'interview').length,
    overdue: visibleEvents.filter(e => e.status === 'overdue').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleToday}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Today
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevious}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              {getDateRangeText()}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'day'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Event Type</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventTypeFilter.followUps}
                      onChange={(e) => setEventTypeFilter({ ...eventTypeFilter, followUps: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Follow-ups ({eventCounts.followUps})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eventTypeFilter.interviews}
                      onChange={(e) => setEventTypeFilter({ ...eventTypeFilter, interviews: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Interviews ({eventCounts.interviews})</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Status</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statusFilter.scheduled}
                      onChange={(e) => setStatusFilter({ ...statusFilter, scheduled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Scheduled</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statusFilter.overdue}
                      onChange={(e) => setStatusFilter({ ...statusFilter, overdue: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Overdue ({eventCounts.overdue})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statusFilter.completed}
                      onChange={(e) => setStatusFilter({ ...statusFilter, completed: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Completed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={statusFilter.cancelled}
                      onChange={(e) => setStatusFilter({ ...statusFilter, cancelled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Cancelled</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{eventCounts.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Events</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{eventCounts.interviews}</div>
            <div className="text-sm text-gray-600 mt-1">Interviews</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{eventCounts.overdue}</div>
            <div className="text-sm text-gray-600 mt-1">Overdue</div>
          </div>
        </div>
      </div>

      {viewMode === 'month' && (
        <MonthView
          currentDate={currentDate}
          events={visibleEvents}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
        />
      )}

      {viewMode === 'week' && (
        <WeekView
          currentDate={currentDate}
          events={visibleEvents}
          onDateClick={handleDateClick}
          onEventClick={handleEventClick}
        />
      )}

      {viewMode === 'day' && (
        <DayView
          currentDate={currentDate}
          events={visibleEvents}
          onEventClick={handleEventClick}
        />
      )}

      {selectedApplication && (
        <ApplicationDetail
          application={selectedApplication}
          onClose={handleCloseDetail}
          onEdit={() => {}}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  );
}
