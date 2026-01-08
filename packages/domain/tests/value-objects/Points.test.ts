import { describe, it, expect } from 'vitest';
import { Points, FIBONACCI_POINTS } from '../../src/value-objects/Points';

describe('Points', () => {
  describe('FIBONACCI_POINTS constant', () => {
    it('should contain the Fibonacci sequence [1, 2, 3, 5, 8, 13, 21]', () => {
      expect(FIBONACCI_POINTS).toEqual([1, 2, 3, 5, 8, 13, 21]);
    });
  });

  describe('create', () => {
    it.each(FIBONACCI_POINTS)('should accept Fibonacci value %d', (value) => {
      const points = Points.create(value);
      expect(points.value).toBe(value);
    });

    it('should reject zero', () => {
      expect(() => Points.create(0)).toThrow('Points must be a valid Fibonacci number');
    });

    it('should reject negative values', () => {
      expect(() => Points.create(-1)).toThrow('Points must be a valid Fibonacci number');
    });

    it.each([4, 6, 7, 9, 10, 11, 12, 14, 15, 20, 22, 100])(
      'should reject non-Fibonacci value %d',
      (value) => {
        expect(() => Points.create(value)).toThrow('Points must be a valid Fibonacci number');
      }
    );
  });

  describe('equals', () => {
    it('should return true for Points with same value', () => {
      const points1 = Points.create(5);
      const points2 = Points.create(5);
      expect(points1.equals(points2)).toBe(true);
    });

    it('should return false for Points with different values', () => {
      const points1 = Points.create(5);
      const points2 = Points.create(8);
      expect(points1.equals(points2)).toBe(false);
    });
  });

  describe('isValidPoints', () => {
    it('should return true for valid Fibonacci values', () => {
      expect(Points.isValid(1)).toBe(true);
      expect(Points.isValid(5)).toBe(true);
      expect(Points.isValid(21)).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(Points.isValid(0)).toBe(false);
      expect(Points.isValid(4)).toBe(false);
      expect(Points.isValid(100)).toBe(false);
    });
  });

  describe('toNumber', () => {
    it('should return the numeric value', () => {
      const points = Points.create(13);
      expect(points.toNumber()).toBe(13);
    });
  });
});
