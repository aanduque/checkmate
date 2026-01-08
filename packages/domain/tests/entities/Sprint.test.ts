import { describe, it, expect } from 'vitest';
import { Sprint } from '../../src/entities/Sprint';

describe('Sprint', () => {
  // Helper to create a valid Sunday date
  const getSunday = (offset: number = 0): Date => {
    const date = new Date();
    const day = date.getDay();
    date.setDate(date.getDate() - day + offset * 7); // Move to Sunday
    date.setHours(0, 0, 0, 0);
    return date;
  };

  describe('create', () => {
    it('should create a sprint starting on Sunday with 7 day duration', () => {
      const startDate = getSunday();
      const sprint = Sprint.create(startDate);

      expect(sprint.id).toBeDefined();
      expect(sprint.startDate).toEqual(startDate);

      // End date should be 6 days after start (inclusive 7 days)
      const expectedEnd = new Date(startDate);
      expectedEnd.setDate(expectedEnd.getDate() + 6);
      expect(sprint.endDate).toEqual(expectedEnd);
    });

    it('should throw if start date is not a Sunday', () => {
      const monday = new Date();
      monday.setDate(monday.getDate() - monday.getDay() + 1); // Set to Monday
      monday.setHours(0, 0, 0, 0);

      expect(() => Sprint.create(monday)).toThrow(
        'Sprint must start on a Sunday'
      );
    });

    it('should normalize start date to midnight', () => {
      const sunday = getSunday();
      sunday.setHours(15, 30, 45, 123); // Set non-midnight time

      const sprint = Sprint.create(sunday);

      expect(sprint.startDate.getHours()).toBe(0);
      expect(sprint.startDate.getMinutes()).toBe(0);
      expect(sprint.startDate.getSeconds()).toBe(0);
      expect(sprint.startDate.getMilliseconds()).toBe(0);
    });
  });

  describe('createForCurrentWeek', () => {
    it('should create a sprint for the current week', () => {
      const sprint = Sprint.createForCurrentWeek();
      const today = new Date();
      const expectedSunday = getSunday();

      expect(sprint.startDate).toEqual(expectedSunday);
    });
  });

  describe('getCapacity', () => {
    it('should return default capacity for tag without override', () => {
      const sprint = Sprint.create(getSunday());
      const capacity = sprint.getCapacity('tag-1', 25);

      expect(capacity).toBe(25);
    });

    it('should return overridden capacity when set', () => {
      const sprint = Sprint.create(getSunday());
      const updated = sprint.setCapacityOverride('tag-1', 30);

      expect(updated.getCapacity('tag-1', 25)).toBe(30);
    });
  });

  describe('setCapacityOverride', () => {
    it('should set capacity override for a tag', () => {
      const sprint = Sprint.create(getSunday());
      const updated = sprint.setCapacityOverride('tag-1', 40);

      expect(updated.getCapacity('tag-1', 25)).toBe(40);
    });

    it('should throw for invalid capacity', () => {
      const sprint = Sprint.create(getSunday());
      expect(() => sprint.setCapacityOverride('tag-1', 0)).toThrow(
        'Capacity must be greater than 0'
      );
    });

    it('should not mutate original', () => {
      const sprint = Sprint.create(getSunday());
      sprint.setCapacityOverride('tag-1', 40);
      expect(sprint.getCapacity('tag-1', 25)).toBe(25);
    });
  });

  describe('clearCapacityOverride', () => {
    it('should remove capacity override for a tag', () => {
      const sprint = Sprint.create(getSunday());
      const withOverride = sprint.setCapacityOverride('tag-1', 40);
      const cleared = withOverride.clearCapacityOverride('tag-1');

      expect(cleared.getCapacity('tag-1', 25)).toBe(25);
    });
  });

  describe('getDaysRemaining', () => {
    it('should return 7 for a sprint starting today', () => {
      const today = getSunday();
      // Force today to be Sunday for this test
      const sprint = Sprint.create(today);

      // On the start date, we have 7 days including today
      const remaining = sprint.getDaysRemaining(today);
      expect(remaining).toBe(7);
    });

    it('should return 0 if sprint has ended', () => {
      const pastSunday = getSunday(-2); // 2 weeks ago
      const sprint = Sprint.create(pastSunday);

      const remaining = sprint.getDaysRemaining(new Date());
      expect(remaining).toBe(0);
    });
  });

  describe('isActive', () => {
    it('should return true if current date is within sprint', () => {
      const sprint = Sprint.createForCurrentWeek();
      expect(sprint.isActive(new Date())).toBe(true);
    });

    it('should return false if current date is after sprint', () => {
      const pastSunday = getSunday(-2);
      const sprint = Sprint.create(pastSunday);
      expect(sprint.isActive(new Date())).toBe(false);
    });

    it('should return false if current date is before sprint', () => {
      const futureSunday = getSunday(2);
      const sprint = Sprint.create(futureSunday);

      const now = new Date();
      expect(sprint.isActive(now)).toBe(false);
    });
  });

  describe('getLabel', () => {
    it('should return "This Week" for current sprint', () => {
      const sprint = Sprint.createForCurrentWeek();
      expect(sprint.getLabel(0)).toBe('This Week');
    });

    it('should return "Next Week" for next sprint', () => {
      const sprint = Sprint.createForCurrentWeek();
      expect(sprint.getLabel(1)).toBe('Next Week');
    });
  });

  describe('fromObject / toObject', () => {
    it('should serialize and deserialize a sprint', () => {
      const sprint = Sprint.create(getSunday());
      const updated = sprint.setCapacityOverride('tag-1', 30);

      const obj = updated.toObject();
      const restored = Sprint.fromObject(obj);

      expect(restored.id).toBe(updated.id);
      expect(restored.startDate).toEqual(updated.startDate);
      expect(restored.endDate).toEqual(updated.endDate);
      expect(restored.getCapacity('tag-1', 25)).toBe(30);
    });
  });
});
