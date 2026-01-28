import { useState, useEffect } from 'react';
import { Search, X, Filter, Calendar, DollarSign, Tag as TagIcon } from 'lucide-react';
import { APPLICATION_STATUSES } from '../lib/database.types';
import type { ApplicationStatus, Tag } from '../lib/database.types';
import { tagsApi } from '../lib/tagsApi';

export interface AdvancedSearchCriteria {
  query: string;
  statuses: ApplicationStatus[];
  workTypes: string[];
  sources: string[];
  dateFrom: string;
  dateTo: string;
  salaryMin: string;
  salaryMax: string;
  hasReferral: boolean | null;
  hasInterviews: boolean | null;
  tagIds: string[];
}

interface AdvancedSearchProps {
  onSearch: (criteria: AdvancedSearchCriteria) => void;
  onClear: () => void;
  initialCriteria?: AdvancedSearchCriteria;
}

const WORK_TYPES = ['Remote', 'Hybrid', 'On-site'];
const APPLICATION_SOURCES = ['LinkedIn', 'Company Website', 'Referral', 'Recruiter', 'Job Board', 'Other'];

export default function AdvancedSearch({ onSearch, onClear, initialCriteria }: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [criteria, setCriteria] = useState<AdvancedSearchCriteria>(
    initialCriteria || {
      query: '',
      statuses: [],
      workTypes: [],
      sources: [],
      dateFrom: '',
      dateTo: '',
      salaryMin: '',
      salaryMax: '',
      hasReferral: null,
      hasInterviews: null,
      tagIds: [],
    }
  );

  useEffect(() => {
    async function loadTags() {
      try {
        const tags = await tagsApi.getAll();
        setAllTags(tags);
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    }
    loadTags();
  }, []);

  function handleSearch() {
    onSearch(criteria);
  }

  function handleClear() {
    const clearedCriteria: AdvancedSearchCriteria = {
      query: '',
      statuses: [],
      workTypes: [],
      sources: [],
      dateFrom: '',
      dateTo: '',
      salaryMin: '',
      salaryMax: '',
      hasReferral: null,
      hasInterviews: null,
      tagIds: [],
    };
    setCriteria(clearedCriteria);
    onClear();
    setIsExpanded(false);
  }

  function toggleStatus(status: ApplicationStatus) {
    setCriteria({
      ...criteria,
      statuses: criteria.statuses.includes(status)
        ? criteria.statuses.filter(s => s !== status)
        : [...criteria.statuses, status],
    });
  }

  function toggleWorkType(type: string) {
    setCriteria({
      ...criteria,
      workTypes: criteria.workTypes.includes(type)
        ? criteria.workTypes.filter(t => t !== type)
        : [...criteria.workTypes, type],
    });
  }

  function toggleSource(source: string) {
    setCriteria({
      ...criteria,
      sources: criteria.sources.includes(source)
        ? criteria.sources.filter(s => s !== source)
        : [...criteria.sources, source],
    });
  }

  function toggleTag(tagId: string) {
    setCriteria({
      ...criteria,
      tagIds: criteria.tagIds.includes(tagId)
        ? criteria.tagIds.filter(id => id !== tagId)
        : [...criteria.tagIds, tagId],
    });
  }

  const hasActiveFilters =
    criteria.query !== '' ||
    criteria.statuses.length > 0 ||
    criteria.workTypes.length > 0 ||
    criteria.sources.length > 0 ||
    criteria.dateFrom !== '' ||
    criteria.dateTo !== '' ||
    criteria.salaryMin !== '' ||
    criteria.salaryMax !== '' ||
    criteria.hasReferral !== null ||
    criteria.hasInterviews !== null ||
    criteria.tagIds.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by company, position, location, or notes..."
            value={criteria.query}
            onChange={(e) => setCriteria({ ...criteria, query: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isExpanded || hasActiveFilters
              ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Advanced
          {hasActiveFilters && !isExpanded && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {[
                criteria.statuses.length > 0,
                criteria.workTypes.length > 0,
                criteria.sources.length > 0,
                criteria.dateFrom || criteria.dateTo,
                criteria.salaryMin || criteria.salaryMax,
                criteria.hasReferral !== null,
                criteria.hasInterviews !== null,
                criteria.tagIds.length > 0,
              ].filter(Boolean).length}
            </span>
          )}
        </button>
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Search
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Status</h4>
              <div className="space-y-2">
                {APPLICATION_STATUSES.map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteria.statuses.includes(status)}
                      onChange={() => toggleStatus(status)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Work Type</h4>
              <div className="space-y-2">
                {WORK_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteria.workTypes.includes(type)}
                      onChange={() => toggleWorkType(type)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Application Source</h4>
              <div className="space-y-2">
                {APPLICATION_SOURCES.map((source) => (
                  <label key={source} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={criteria.sources.includes(source)}
                      onChange={() => toggleSource(source)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{source}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Application Date Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">From</label>
                    <input
                      type="date"
                      value={criteria.dateFrom}
                      onChange={(e) => setCriteria({ ...criteria, dateFrom: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">To</label>
                    <input
                      type="date"
                      value={criteria.dateTo}
                      onChange={(e) => setCriteria({ ...criteria, dateTo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Salary Range (USD)</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Min</label>
                    <input
                      type="number"
                      placeholder="e.g., 80000"
                      value={criteria.salaryMin}
                      onChange={(e) => setCriteria({ ...criteria, salaryMin: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Max</label>
                    <input
                      type="number"
                      placeholder="e.g., 120000"
                      value={criteria.salaryMax}
                      onChange={(e) => setCriteria({ ...criteria, salaryMax: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <TagIcon className="w-4 h-4" />
              Tags
            </h4>
            {allTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isSelected = criteria.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                        isSelected ? 'ring-2 ring-offset-2' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        borderWidth: '1px',
                        borderColor: tag.color + '40',
                        ringColor: tag.color,
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No tags available</p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Filters</h4>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criteria.hasReferral === true}
                  onChange={(e) =>
                    setCriteria({
                      ...criteria,
                      hasReferral: e.target.checked ? true : null,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Has Referral</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={criteria.hasInterviews === true}
                  onChange={(e) =>
                    setCriteria({
                      ...criteria,
                      hasInterviews: e.target.checked ? true : null,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Has Interviews Scheduled</span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
