import { describe, it, expect } from 'vitest';
import { calculateROI, calculatePVI, calculateLeakage, isNewCustomer } from '../src/lib/metrics';

describe('Metrics Calculations', () => {
  describe('calculateROI', () => {
    it('should calculate ROI correctly', () => {
      expect(calculateROI(1000, 200)).toBe(5);
      expect(calculateROI(500, 100)).toBe(5);
      expect(calculateROI(0, 100)).toBe(0);
      expect(calculateROI(100, 0)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(calculateROI(0, 0)).toBe(0);
      expect(calculateROI(100, 50)).toBe(2);
    });
  });

  describe('calculatePVI', () => {
    it('should calculate PVI correctly', () => {
      expect(calculatePVI(1000, 200, 0)).toBe(5);
      expect(calculatePVI(1000, 200, 100)).toBe(3.33);
      expect(calculatePVI(0, 200, 100)).toBe(0);
      expect(calculatePVI(100, 0, 0)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(calculatePVI(0, 0, 0)).toBe(0);
      expect(calculatePVI(100, 50, 25)).toBe(1.33);
    });
  });

  describe('calculateLeakage', () => {
    it('should calculate leakage correctly', () => {
      expect(calculateLeakage(100, 30)).toBe(0.7); // 70% leakage
      expect(calculateLeakage(100, 80)).toBe(0.2); // 20% leakage
      expect(calculateLeakage(100, 100)).toBe(0); // 0% leakage
      expect(calculateLeakage(0, 0)).toBe(0);
    });

    it('should handle edge cases', () => {
      expect(calculateLeakage(50, 60)).toBe(0); // Can't have more new customers than total
      expect(calculateLeakage(10, 5)).toBe(0.5);
    });
  });

  describe('isNewCustomer', () => {
    it('should identify new customers correctly', () => {
      const orderDate = new Date('2024-01-15');
      const firstOrderDate = new Date('2024-01-15');
      
      expect(isNewCustomer(orderDate, firstOrderDate)).toBe(true);
    });

    it('should identify repeat customers correctly', () => {
      const orderDate = new Date('2024-01-20');
      const firstOrderDate = new Date('2024-01-15');
      
      expect(isNewCustomer(orderDate, firstOrderDate)).toBe(false);
    });

    it('should handle same day orders as new', () => {
      const orderDate = new Date('2024-01-15T10:00:00');
      const firstOrderDate = new Date('2024-01-15T14:00:00');
      
      expect(isNewCustomer(orderDate, firstOrderDate)).toBe(true);
    });

    it('should handle next day orders as repeat', () => {
      const orderDate = new Date('2024-01-16T10:00:00');
      const firstOrderDate = new Date('2024-01-15T14:00:00');
      
      expect(isNewCustomer(orderDate, firstOrderDate)).toBe(false);
    });
  });
});

describe('Integration Tests', () => {
  it('should calculate complete metrics correctly', () => {
    const totalRevenue = 1000;
    const discountValue = 200;
    const newCustomerRevenue = 600;
    const budgetAllocation = 100;
    const totalUses = 50;
    const newCustomerUses = 20;

    const roi = calculateROI(totalRevenue, discountValue);
    const pvi = calculatePVI(newCustomerRevenue, discountValue, budgetAllocation);
    const leakage = calculateLeakage(totalUses, newCustomerUses);

    expect(roi).toBe(5);
    expect(pvi).toBe(2);
    expect(leakage).toBe(0.6);
  });
});
