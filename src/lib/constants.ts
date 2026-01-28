export const COLORS = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    500: '#22c55e',
    600: '#16a34a',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    500: '#ef4444',
    600: '#dc2626',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    500: '#f59e0b',
    600: '#d97706',
  },
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
} as const;

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
} as const;

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

export const TOAST_DURATION = {
  short: 3000,
  default: 5000,
  long: 7000,
} as const;

export const API_RETRY = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
} as const;

export const PAGINATION = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
} as const;

export const DATE_FORMATS = {
  display: 'MMM dd, yyyy',
  input: 'yyyy-MM-dd',
  full: 'MMMM dd, yyyy h:mm a',
  time: 'h:mm a',
} as const;

export const DEBOUNCE_DELAY = {
  search: 300,
  input: 500,
  resize: 150,
} as const;

export const Z_INDEX = {
  dropdown: 1000,
  modal: 1100,
  toast: 1200,
  tooltip: 1300,
} as const;

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export const MIN_TOUCH_TARGET = 44;

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

export const ROUTES = {
  dashboard: '/',
  applications: '/applications',
  calendar: '/calendar',
  settings: '/settings',
} as const;

export const LOCAL_STORAGE_KEYS = {
  viewPreference: 'job-tracker-view-preference',
  filters: 'job-tracker-filters',
  theme: 'job-tracker-theme',
} as const;
