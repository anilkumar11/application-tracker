import { useEffect, useState } from 'react';
import { TrendingUp, Target, Calendar, Award, BarChart3, Download } from 'lucide-react';
import { applicationApi } from '../lib/api';
import type { ApplicationWithRelations } from '../lib/database.types';
import { calculateAnalytics, getStatusColor } from '../lib/analytics';
import BarChart from './BarChart';
import LineChart from './LineChart';

export default function Analytics() {
  const [applications, setApplications] = useState<ApplicationWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      const appsData = await applicationApi.getAll();
      setApplications(appsData);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  }

  const exportAnalytics = () => {
    const analytics = calculateAnalytics(applications);
    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const analytics = calculateAnalytics(applications);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
          <p className="text-gray-600 mt-1">Track your job search performance</p>
        </div>
        <button
          onClick={exportAnalytics}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{analytics.totalApplications}</span>
          </div>
          <h3 className="text-sm font-medium opacity-90">Total Applications</h3>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{analytics.conversionRates.appliedToInterview.toFixed(1)}%</span>
          </div>
          <h3 className="text-sm font-medium opacity-90">Interview Rate</h3>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{analytics.conversionRates.overallSuccess.toFixed(1)}%</span>
          </div>
          <h3 className="text-sm font-medium opacity-90">Success Rate</h3>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 opacity-80" />
            <span className="text-3xl font-bold">{analytics.conversionRates.interviewToOffer.toFixed(1)}%</span>
          </div>
          <h3 className="text-sm font-medium opacity-90">Offer Conversion</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Applications by Status"
          data={Object.entries(analytics.byStatus).map(([label, value]) => ({
            label,
            value,
            color: getStatusColor(label),
          }))}
        />

        <BarChart
          title="Applications by Source"
          data={Object.entries(analytics.bySource).map(([label, value]) => ({
            label,
            value,
            color: '#6366f1',
          }))}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChart
          title="Work Type Distribution"
          data={Object.entries(analytics.byWorkType).map(([label, value]) => ({
            label,
            value,
            color: '#8b5cf6',
          }))}
        />

        <LineChart
          title="Applications (Last 30 Days)"
          data={analytics.timeSeriesData.map((d) => ({
            label: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            value: d.count,
          }))}
          color="#3b82f6"
        />
      </div>

      {analytics.monthlyTrends.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Month</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Applications</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Interviews</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Offers</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {analytics.monthlyTrends.map((trend) => (
                  <tr key={trend.month} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {new Date(trend.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">{trend.applications}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{trend.interviews}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right">{trend.offers}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {trend.applications > 0 ? ((trend.offers / trend.applications) * 100).toFixed(1) : 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analytics.topCompanies.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Companies</h3>
          <div className="space-y-3">
            {analytics.topCompanies.map((company, index) => (
              <div key={company.company} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{company.company}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${(company.count / analytics.topCompanies[0].count) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">{company.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
