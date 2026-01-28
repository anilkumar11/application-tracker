import type { ApplicationWithRelations } from './database.types';

export interface AnalyticsData {
  totalApplications: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byWorkType: Record<string, number>;
  timeSeriesData: { date: string; count: number }[];
  conversionRates: {
    appliedToInterview: number;
    interviewToOffer: number;
    overallSuccess: number;
  };
  averageDays: {
    toFirstResponse: number;
    toInterview: number;
    toOffer: number;
  };
  monthlyTrends: { month: string; applications: number; interviews: number; offers: number }[];
  topCompanies: { company: string; count: number }[];
}

export function calculateAnalytics(applications: ApplicationWithRelations[]): AnalyticsData {
  const now = new Date();
  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byWorkType: Record<string, number> = {};
  const companyCounts: Record<string, number> = {};

  applications.forEach((app) => {
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    bySource[app.application_source] = (bySource[app.application_source] || 0) + 1;
    byWorkType[app.work_type] = (byWorkType[app.work_type] || 0) + 1;
    companyCounts[app.company_name] = (companyCounts[app.company_name] || 0) + 1;
  });

  const last30Days = new Date(now);
  last30Days.setDate(now.getDate() - 30);

  const timeSeriesMap: Record<string, number> = {};
  applications.forEach((app) => {
    const appDate = new Date(app.application_date);
    if (appDate >= last30Days) {
      const dateKey = appDate.toISOString().split('T')[0];
      timeSeriesMap[dateKey] = (timeSeriesMap[dateKey] || 0) + 1;
    }
  });

  const timeSeriesData = Object.entries(timeSeriesMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const monthlyMap: Record<string, { applications: number; interviews: number; offers: number }> = {};
  applications.forEach((app) => {
    const appDate = new Date(app.application_date);
    const monthKey = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { applications: 0, interviews: 0, offers: 0 };
    }

    monthlyMap[monthKey].applications += 1;

    if (app.status.toLowerCase().includes('interview') ||
        (app.interview_rounds && app.interview_rounds.length > 0)) {
      monthlyMap[monthKey].interviews += 1;
    }

    if (app.status.toLowerCase().includes('offer') || app.status.toLowerCase().includes('accepted')) {
      monthlyMap[monthKey].offers += 1;
    }
  });

  const monthlyTrends = Object.entries(monthlyMap)
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-6);

  const topCompanies = Object.entries(companyCounts)
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalApplied = applications.length;
  const hasInterview = applications.filter(
    (app) => app.status.toLowerCase().includes('interview') ||
    (app.interview_rounds && app.interview_rounds.length > 0)
  ).length;
  const hasOffer = applications.filter(
    (app) => app.status.toLowerCase().includes('offer') || app.status.toLowerCase().includes('accepted')
  ).length;

  const conversionRates = {
    appliedToInterview: totalApplied > 0 ? (hasInterview / totalApplied) * 100 : 0,
    interviewToOffer: hasInterview > 0 ? (hasOffer / hasInterview) * 100 : 0,
    overallSuccess: totalApplied > 0 ? (hasOffer / totalApplied) * 100 : 0,
  };

  const averageDays = {
    toFirstResponse: 0,
    toInterview: 0,
    toOffer: 0,
  };

  return {
    totalApplications: applications.length,
    byStatus,
    bySource,
    byWorkType,
    timeSeriesData,
    conversionRates,
    averageDays,
    monthlyTrends,
    topCompanies,
  };
}

export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower.includes('offer') || statusLower.includes('accepted')) return '#10b981';
  if (statusLower.includes('interview')) return '#3b82f6';
  if (statusLower.includes('rejected') || statusLower.includes('withdrawn')) return '#ef4444';
  if (statusLower === 'applied') return '#6366f1';
  return '#8b5cf6';
}
