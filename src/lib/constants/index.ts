// Application Constants
export const APP_NAME = 'Buyer Lead Intake';
export const APP_VERSION = '1.0.0';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  BUYERS: '/buyers',
  NEW_BUYER: '/buyers/new',
  ADMIN_DASHBOARD: '/admin/dashboard',
  SET_ADMIN: '/admin/set-admin',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  FULL_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  EMAIL: {
    MAX_LENGTH: 255,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },
  BUDGET: {
    MIN: 0,
    MAX: 1000000000, // 1 billion
  },
  NOTES: {
    MAX_LENGTH: 1000,
  },
} as const;

// Cities
export const CITIES = [
  'Chandigarh',
  'Mohali',
  'Zirakpur',
  'Panchkula',
  'Other',
] as const;

// Property Types
export const PROPERTY_TYPES = [
  'Apartment',
  'Villa',
  'Plot',
  'Office',
  'Retail',
] as const;

// BHK Options
export const BHK_OPTIONS = [
  '1',
  '2',
  '3',
  '4',
  'Studio',
] as const;

// Purposes
export const PURPOSES = [
  'Buy',
  'Rent',
] as const;

// Timelines
export const TIMELINES = [
  '0-3m',
  '3-6m',
  '>6m',
  'Exploring',
] as const;

// Sources
export const SOURCES = [
  'Website',
  'Referral',
  'Walk-in',
  'Call',
  'Other',
] as const;

// Statuses
export const STATUSES = [
  'New',
  'Qualified',
  'Contacted',
  'Visited',
  'Negotiation',
  'Converted',
  'Dropped',
] as const;

// Status Configuration
export const STATUS_CONFIG = {
  New: {
    color: 'bg-blue-100 text-blue-800',
    icon: '🆕',
    description: 'New lead received',
  },
  Qualified: {
    color: 'bg-green-100 text-green-800',
    icon: '✅',
    description: 'Lead qualified',
  },
  Contacted: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: '📞',
    description: 'Initial contact made',
  },
  Visited: {
    color: 'bg-purple-100 text-purple-800',
    icon: '🏠',
    description: 'Property visited',
  },
  Negotiation: {
    color: 'bg-orange-100 text-orange-800',
    icon: '🤝',
    description: 'In negotiation',
  },
  Converted: {
    color: 'bg-emerald-100 text-emerald-800',
    icon: '💰',
    description: 'Deal closed',
  },
  Dropped: {
    color: 'bg-red-100 text-red-800',
    icon: '❌',
    description: 'Lead dropped',
  },
} as const;

// Property Type Icons
export const PROPERTY_TYPE_ICONS = {
  Apartment: '🏢',
  Villa: '🏡',
  Plot: '📐',
  Office: '🏢',
  Retail: '🏪',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
} as const;

// CSV Import/Export
export const CSV_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FORMATS: ['.csv'],
  REQUIRED_COLUMNS: [
    'fullName',
    'email',
    'phone',
    'city',
    'propertyType',
    'purpose',
    'timeline',
    'source',
  ],
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  CREATE_BUYER: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,
  },
  IMPORT_CSV: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
  },
  EXPORT_CSV: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  SERVER_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  FILE_TOO_LARGE: 'File size exceeds limit',
  INVALID_FILE_FORMAT: 'Invalid file format',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_ENUM_VALUE: 'Invalid enum value',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  BUYER_CREATED: 'Buyer created successfully',
  BUYER_UPDATED: 'Buyer updated successfully',
  BUYER_DELETED: 'Buyer deleted successfully',
  CSV_IMPORTED: 'CSV imported successfully',
  CSV_EXPORTED: 'CSV exported successfully',
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
} as const;
