import { describe, it, expect } from 'vitest';
import { Sprint } from '../../src/entities/Sprint';
import { TagId } from '../../src/value-objects/TagId';

describe('Sprint', () => {
  describe('create', () => {
    it('should create a sprint starting on Sunday', () => {
      const sunday = new Date('2025-01-05'); // A Sunday
      const sprint = Sprint.create(sunday);

      expect(sprint.id).toBeDefined();
      expect(sprint.startDate.getDay()).toBe(0); // Sunday
      expect(sprint.endDate.getDay()).toBe(6); // Saturday
    });

    it('should reject non-Sunday start dates', () => {
      const monday = new Date('2025-01-06'); // A Monday

      expect(() => Sprint.create(monday)).toThrow('Sprint must start on a Sunday');
    });

    it('should set correct end date (6 days after start)', () => {
      const sunday = new Date('2025-01-05');
      const sprint = Sprint.create(sunday);

      const expectedEnd = new Date('2025-01-11');
      expect(sprint.endDate.toDateString()).toBe(expectedEnd.toDateString());
    });
  });

  describe('containsDate', () => {
    it('should return true for dates within sprint', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));

      expect(sprint.containsDate(new Date('2025-01-07'))).toBe(true);
      expect(sprint.containsDate(new Date('2025-01-05'))).toBe(true);
      expect(sprint.containsDate(new Date('2025-01-11'))).toBe(true);
    });

    it('should return false for dates outside sprint', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));

      expect(sprint.containsDate(new Date('2025-01-04'))).toBe(false);
      expect(sprint.containsDate(new Date('2025-01-12'))).toBe(false);
    });
  });

  describe('getDaysRemaining', () => {
    it('should return correct days remaining', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));

      expect(sprint.getDaysRemaining(new Date('2025-01-05'))).toBe(7);
      expect(sprint.getDaysRemaining(new Date('2025-01-08'))).toBe(4);
      expect(sprint.getDaysRemaining(new Date('2025-01-11'))).toBe(1);
    });

    it('should return 0 for past sprints', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));

      expect(sprint.getDaysRemaining(new Date('2025-01-15'))).toBe(0);
    });
  });

  describe('capacity overrides', () => {
    it('should use default capacity when no override', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));
      const tagId = TagId.create();

      expect(sprint.getCapacityForTag(tagId, 25)).toBe(25);
    });

    it('should use override when set', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));
      const tagId = TagId.create();

      sprint.setCapacityOverride(tagId, 15);

      expect(sprint.getCapacityForTag(tagId, 25)).toBe(15);
    });

    it('should clear override', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));
      const tagId = TagId.create();
      sprint.setCapacityOverride(tagId, 15);

      sprint.clearCapacityOverride(tagId);

      expect(sprint.getCapacityForTag(tagId, 25)).toBe(25);
    });

    it('should reject non-positive capacity', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));
      const tagId = TagId.create();

      expect(() => sprint.setCapacityOverride(tagId, 0)).toThrow(
        'Capacity must be positive'
      );
    });
  });
});
