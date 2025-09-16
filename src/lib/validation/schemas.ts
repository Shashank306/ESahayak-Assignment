import { z } from 'zod';
import { VALIDATION_RULES, CITIES, PROPERTY_TYPES, BHK_OPTIONS, PURPOSES, TIMELINES, SOURCES, STATUSES } from '@/lib/constants';

// Base buyer schema
export const buyerSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(VALIDATION_RULES.FULL_NAME.MIN_LENGTH).max(VALIDATION_RULES.FULL_NAME.MAX_LENGTH),
  email: z.string().email().max(VALIDATION_RULES.EMAIL.MAX_LENGTH),
  phone: z.string().min(VALIDATION_RULES.PHONE.MIN_LENGTH).max(VALIDATION_RULES.PHONE.MAX_LENGTH),
  city: z.enum(CITIES as [string, ...string[]]),
  propertyType: z.enum(PROPERTY_TYPES as [string, ...string[]]),
  bhk: z.enum(BHK_OPTIONS as [string, ...string[]]).optional(),
  purpose: z.enum(PURPOSES as [string, ...string[]]),
  budgetMin: z.number().min(VALIDATION_RULES.BUDGET.MIN).max(VALIDATION_RULES.BUDGET.MAX),
  budgetMax: z.number().min(VALIDATION_RULES.BUDGET.MIN).max(VALIDATION_RULES.BUDGET.MAX),
  timeline: z.enum(TIMELINES as [string, ...string[]]),
  source: z.enum(SOURCES as [string, ...string[]]),
  status: z.enum(STATUSES as [string, ...string[]]),
  notes: z.string().max(VALIDATION_RULES.NOTES.MAX_LENGTH).optional(),
  tags: z.array(z.string()).optional(),
  ownerId: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema for creating a new buyer
export const createBuyerSchema = buyerSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  status: z.enum(STATUSES as [string, ...string[]]).default('New'),
  tags: z.array(z.string()).default([]),
});

// Schema for updating a buyer
export const updateBuyerSchema = buyerSchema.partial().extend({
  id: z.string().uuid(),
  updatedAt: z.date(),
});

// Schema for buyer filters
export const buyerFiltersSchema = z.object({
  search: z.string().optional(),
  city: z.enum(CITIES as [string, ...string[]]).optional(),
  propertyType: z.enum(PROPERTY_TYPES as [string, ...string[]]).optional(),
  status: z.enum(STATUSES as [string, ...string[]]).optional(),
  timeline: z.enum(TIMELINES as [string, ...string[]]).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'fullName', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Schema for CSV import
export const csvImportSchema = z.object({
  fullName: z.string().min(VALIDATION_RULES.FULL_NAME.MIN_LENGTH).max(VALIDATION_RULES.FULL_NAME.MAX_LENGTH),
  email: z.string().email().max(VALIDATION_RULES.EMAIL.MAX_LENGTH),
  phone: z.string().min(VALIDATION_RULES.PHONE.MIN_LENGTH).max(VALIDATION_RULES.PHONE.MAX_LENGTH),
  city: z.enum(CITIES as [string, ...string[]]),
  propertyType: z.enum(PROPERTY_TYPES as [string, ...string[]]),
  bhk: z.string().optional().refine(val => !val || val === '' || BHK_OPTIONS.includes(val as typeof BHK_OPTIONS[number]), {
    message: 'Invalid BHK value'
  }).transform(val => val === '' ? undefined : val),
  purpose: z.enum(PURPOSES as [string, ...string[]]),
  budgetMin: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(VALIDATION_RULES.BUDGET.MIN).max(VALIDATION_RULES.BUDGET.MAX)),
  budgetMax: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(VALIDATION_RULES.BUDGET.MIN).max(VALIDATION_RULES.BUDGET.MAX)),
  timeline: z.enum(TIMELINES as [string, ...string[]]),
  source: z.enum(SOURCES as [string, ...string[]]),
  notes: z.string().max(VALIDATION_RULES.NOTES.MAX_LENGTH).optional(),
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : []),
  status: z.enum(STATUSES as [string, ...string[]]).default('New'),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
}).refine(
  (data) => {
    // BHK is required for Apartment and Villa
    if ((data.propertyType === 'Apartment' || data.propertyType === 'Villa') && !data.bhk) {
      return false;
    }
    return true;
  },
  {
    message: 'BHK is required for Apartment and Villa property types',
    path: ['bhk'],
  }
).refine(
  (data) => data.budgetMax >= data.budgetMin,
  {
    message: 'Maximum budget must be greater than or equal to minimum budget',
    path: ['budgetMax'],
  }
);

// Type exports
export type Buyer = z.infer<typeof buyerSchema>;
export type CreateBuyer = z.infer<typeof createBuyerSchema>;
export type UpdateBuyer = z.infer<typeof updateBuyerSchema>;
export type BuyerFilters = z.infer<typeof buyerFiltersSchema>;
export type CsvImport = z.infer<typeof csvImportSchema>;
