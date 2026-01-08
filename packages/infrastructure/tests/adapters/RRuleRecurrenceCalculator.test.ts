/**
 * RRuleRecurrenceCalculator Tests (TDD - Red Phase First)
 *
 * Tests the RRule-based implementation of IRecurrenceCalculator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RRuleRecurrenceCalculator } from '../../src/adapters/RRuleRecurrenceCalculator';
import type { IRecurrenceCalculator } from '@checkmate/domain';

describe('RRuleRecurrenceCalculator', () => {
  let calculator: IRecurrenceCalculator;

  beforeEach(() => {
    calculator = new RRuleRecurrenceCalculator();
  });

  describe('validate', () => {
    it('should return valid for correct RRULE strings', () => {
      const result = calculator.validate('FREQ=DAILY');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for weekly recurrence', () => {
      const result = calculator.validate('FREQ=WEEKLY;BYDAY=MO,WE,FR');
      expect(result.valid).toBe(true);
    });

    it('should return valid for monthly recurrence', () => {
      const result = calculator.validate('FREQ=MONTHLY;BYMONTHDAY=1');
      expect(result.valid).toBe(true);
    });

    it('should return valid for yearly recurrence', () => {
      const result = calculator.validate('FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1');
      expect(result.valid).toBe(true);
    });

    it('should return invalid for malformed RRULE', () => {
      const result = calculator.validate('INVALID_RRULE');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid for empty string', () => {
      const result = calculator.validate('');
      expect(result.valid).toBe(false);
    });

    it('should return valid for RRULE with interval', () => {
      const result = calculator.validate('FREQ=DAILY;INTERVAL=2');
      expect(result.valid).toBe(true);
    });

    it('should return valid for RRULE with count', () => {
      const result = calculator.validate('FREQ=DAILY;COUNT=10');
      expect(result.valid).toBe(true);
    });

    it('should return valid for RRULE with until date', () => {
      const result = calculator.validate('FREQ=DAILY;UNTIL=20251231T235959Z');
      expect(result.valid).toBe(true);
    });
  });

  describe('parse', () => {
    it('should parse a valid RRULE', () => {
      const parsed = calculator.parse('FREQ=DAILY');
      expect(parsed.isValid).toBe(true);
      expect(parsed.rruleString).toBe('FREQ=DAILY');
    });

    it('should return invalid for malformed RRULE', () => {
      const parsed = calculator.parse('NOT_VALID');
      expect(parsed.isValid).toBe(false);
    });

    it('should include description for valid RRULE', () => {
      const parsed = calculator.parse('FREQ=DAILY');
      expect(parsed.description).toBeDefined();
      expect(parsed.description).toContain('day');
    });
  });

  describe('getNextOccurrence', () => {
    it('should get next occurrence for daily recurrence', () => {
      const after = new Date('2025-01-15T10:00:00Z');
      const next = calculator.getNextOccurrence('FREQ=DAILY', after);

      expect(next).not.toBeNull();
      expect(next!.getTime()).toBeGreaterThan(after.getTime());
    });

    it('should get next occurrence for weekly recurrence', () => {
      // Wednesday Jan 15, 2025
      const after = new Date('2025-01-15T10:00:00Z');
      // MO,WE,FR means next should be Friday Jan 17
      const next = calculator.getNextOccurrence('FREQ=WEEKLY;BYDAY=MO,WE,FR', after);

      expect(next).not.toBeNull();
      // Should be within the next week
      const weekLater = new Date(after);
      weekLater.setDate(weekLater.getDate() + 7);
      expect(next!.getTime()).toBeLessThan(weekLater.getTime());
    });

    it('should return null for RRULE with past UNTIL date', () => {
      const after = new Date('2025-01-15T10:00:00Z');
      const next = calculator.getNextOccurrence('FREQ=DAILY;UNTIL=20240101T000000Z', after);

      expect(next).toBeNull();
    });

    it('should return null for invalid RRULE', () => {
      const after = new Date('2025-01-15T10:00:00Z');
      const next = calculator.getNextOccurrence('INVALID', after);

      expect(next).toBeNull();
    });

    it('should get next monthly occurrence', () => {
      const after = new Date('2025-01-15T10:00:00Z');
      const next = calculator.getNextOccurrence('FREQ=MONTHLY;BYMONTHDAY=1', after);

      expect(next).not.toBeNull();
      // Next 1st of month should be Feb 1
      expect(next!.getMonth()).toBe(1); // February (0-indexed)
      expect(next!.getDate()).toBe(1);
    });
  });

  describe('getOccurrences', () => {
    it('should get occurrences for daily recurrence within range', () => {
      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-01-05T23:59:59Z');
      const occurrences = calculator.getOccurrences('FREQ=DAILY', start, end);

      // Should have 5 days (Jan 1-5)
      expect(occurrences.length).toBe(5);
    });

    it('should get occurrences for weekly Mon/Wed/Fri within range', () => {
      const start = new Date('2025-01-06T00:00:00Z'); // Monday
      const end = new Date('2025-01-12T23:59:59Z'); // Sunday
      const occurrences = calculator.getOccurrences('FREQ=WEEKLY;BYDAY=MO,WE,FR', start, end);

      // Should have 3 occurrences: Mon, Wed, Fri
      expect(occurrences.length).toBe(3);
    });

    it('should return empty array for invalid RRULE', () => {
      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-01-31T23:59:59Z');
      const occurrences = calculator.getOccurrences('INVALID', start, end);

      expect(occurrences).toEqual([]);
    });

    it('should return empty array when no occurrences in range', () => {
      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-01-31T23:59:59Z');
      // UNTIL date is before start
      const occurrences = calculator.getOccurrences('FREQ=DAILY;UNTIL=20241231T000000Z', start, end);

      expect(occurrences).toEqual([]);
    });

    it('should respect COUNT limit', () => {
      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-12-31T23:59:59Z'); // Full year
      const occurrences = calculator.getOccurrences('FREQ=DAILY;COUNT=10', start, end);

      // Should have at most 10 occurrences despite longer range
      expect(occurrences.length).toBeLessThanOrEqual(10);
    });

    it('should handle every other day (interval=2)', () => {
      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-01-10T23:59:59Z');
      const occurrences = calculator.getOccurrences('FREQ=DAILY;INTERVAL=2', start, end);

      // Jan 1, 3, 5, 7, 9 = 5 occurrences
      expect(occurrences.length).toBe(5);
    });
  });

  describe('getDescription', () => {
    it('should describe daily recurrence', () => {
      const desc = calculator.getDescription('FREQ=DAILY');
      expect(desc.toLowerCase()).toContain('day');
    });

    it('should describe weekly recurrence', () => {
      const desc = calculator.getDescription('FREQ=WEEKLY');
      expect(desc.toLowerCase()).toContain('week');
    });

    it('should describe monthly recurrence', () => {
      const desc = calculator.getDescription('FREQ=MONTHLY');
      expect(desc.toLowerCase()).toContain('month');
    });

    it('should describe yearly recurrence', () => {
      const desc = calculator.getDescription('FREQ=YEARLY');
      expect(desc.toLowerCase()).toContain('year');
    });

    it('should include day names for BYDAY', () => {
      const desc = calculator.getDescription('FREQ=WEEKLY;BYDAY=MO,WE,FR');
      // Should mention the days
      expect(desc.toLowerCase()).toMatch(/monday|mon/);
    });

    it('should return error message for invalid RRULE', () => {
      const desc = calculator.getDescription('INVALID');
      expect(desc).toContain('Invalid');
    });
  });

  describe('real-world examples', () => {
    it('should handle daily standup (every weekday at 9am)', () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
      expect(calculator.validate(rrule).valid).toBe(true);

      const start = new Date('2025-01-06T00:00:00Z'); // Monday
      const end = new Date('2025-01-12T23:59:59Z'); // Sunday
      const occurrences = calculator.getOccurrences(rrule, start, end);

      // Should have 5 weekdays
      expect(occurrences.length).toBe(5);
    });

    it('should handle weekly review (every Sunday)', () => {
      const rrule = 'FREQ=WEEKLY;BYDAY=SU';
      expect(calculator.validate(rrule).valid).toBe(true);

      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-01-31T23:59:59Z');
      const occurrences = calculator.getOccurrences(rrule, start, end);

      // January 2025 has 4 Sundays (5, 12, 19, 26)
      expect(occurrences.length).toBe(4);
    });

    it('should handle monthly bills (1st of every month)', () => {
      const rrule = 'FREQ=MONTHLY;BYMONTHDAY=1';
      expect(calculator.validate(rrule).valid).toBe(true);

      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-06-30T23:59:59Z');
      const occurrences = calculator.getOccurrences(rrule, start, end);

      // Jan, Feb, Mar, Apr, May, Jun = 6 months
      expect(occurrences.length).toBe(6);
    });

    it('should handle quarterly review (every 3 months)', () => {
      const rrule = 'FREQ=MONTHLY;INTERVAL=3;BYMONTHDAY=1';
      expect(calculator.validate(rrule).valid).toBe(true);

      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2025-12-31T23:59:59Z');
      const occurrences = calculator.getOccurrences(rrule, start, end);

      // Jan, Apr, Jul, Oct = 4 quarters
      expect(occurrences.length).toBe(4);
    });

    it('should handle annual birthday (specific date each year)', () => {
      const rrule = 'FREQ=YEARLY;BYMONTH=6;BYMONTHDAY=15';
      expect(calculator.validate(rrule).valid).toBe(true);

      const start = new Date('2025-01-01T00:00:00Z');
      const end = new Date('2027-12-31T23:59:59Z');
      const occurrences = calculator.getOccurrences(rrule, start, end);

      // June 15 in 2025, 2026, 2027 = 3 occurrences
      expect(occurrences.length).toBe(3);
    });
  });
});
