import { describe, it, expect } from '@jest/globals';
import { createBuyerSchema, updateBuyerSchema } from '@/lib/validation/schemas';

describe('Buyer Validation', () => {
  describe('createBuyerSchema', () => {
    it('should validate a complete buyer record', () => {
      const validBuyer = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        budgetMin: 5000000,
        budgetMax: 10000000,
        timeline: '3-6m',
        source: 'Website',
        status: 'New',
        notes: 'Looking for a 2BHK apartment',
        tags: ['urgent', 'premium'],
      };

      const result = createBuyerSchema.safeParse(validBuyer);
      expect(result.success).toBe(true);
    });

    it('should require BHK for Apartment property type', () => {
      const invalidBuyer = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        purpose: 'Buy',
        timeline: '3-6m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('bhk');
      }
    });

    it('should validate budget constraints', () => {
      const invalidBuyer = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Plot',
        purpose: 'Buy',
        budgetMin: 10000000,
        budgetMax: 5000000, // Less than min
        timeline: '3-6m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('budgetMax');
      }
    });

    it('should validate phone number format', () => {
      const invalidBuyer = {
        fullName: 'John Doe',
        phone: '123', // Too short
        city: 'Chandigarh',
        propertyType: 'Plot',
        purpose: 'Buy',
        timeline: '3-6m',
        source: 'Website',
      };

      const result = createBuyerSchema.safeParse(invalidBuyer);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('phone');
      }
    });
  });

  describe('updateBuyerSchema', () => {
    it('should validate partial updates', () => {
      const update = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        fullName: 'Jane Doe',
        updatedAt: new Date(),
      };

      const result = updateBuyerSchema.safeParse(update);
      expect(result.success).toBe(true);
    });

    it('should require id and updatedAt for updates', () => {
      const update = {
        fullName: 'Jane Doe',
      };

      const result = updateBuyerSchema.safeParse(update);
      expect(result.success).toBe(false);
    });
  });
});
