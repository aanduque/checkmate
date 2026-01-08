import { describe, it, expect } from 'vitest';
import { TaskLocation } from '../../src/value-objects/TaskLocation';

describe('TaskLocation', () => {
  describe('backlog', () => {
    it('should create a backlog location', () => {
      const location = TaskLocation.backlog();
      expect(location.type).toBe('backlog');
      expect(location.isBacklog()).toBe(true);
      expect(location.isSprint()).toBe(false);
    });

    it('should not have sprintId', () => {
      const location = TaskLocation.backlog();
      expect(location.sprintId).toBeUndefined();
    });
  });

  describe('sprint', () => {
    it('should create a sprint location with sprintId', () => {
      const location = TaskLocation.sprint('sprint-123');
      expect(location.type).toBe('sprint');
      expect(location.sprintId).toBe('sprint-123');
      expect(location.isSprint()).toBe(true);
      expect(location.isBacklog()).toBe(false);
    });

    it('should throw for empty sprintId', () => {
      expect(() => TaskLocation.sprint('')).toThrow(
        'Sprint ID cannot be empty'
      );
    });

    it('should throw for whitespace-only sprintId', () => {
      expect(() => TaskLocation.sprint('   ')).toThrow(
        'Sprint ID cannot be empty'
      );
    });
  });

  describe('fromObject', () => {
    it('should create backlog location from object', () => {
      const location = TaskLocation.fromObject({ type: 'backlog' });
      expect(location.isBacklog()).toBe(true);
    });

    it('should create sprint location from object', () => {
      const location = TaskLocation.fromObject({
        type: 'sprint',
        sprintId: 'sprint-456'
      });
      expect(location.isSprint()).toBe(true);
      expect(location.sprintId).toBe('sprint-456');
    });

    it('should throw for sprint without sprintId', () => {
      expect(() =>
        TaskLocation.fromObject({ type: 'sprint' } as any)
      ).toThrow('Sprint ID is required for sprint location');
    });

    it('should throw for invalid type', () => {
      expect(() =>
        TaskLocation.fromObject({ type: 'invalid' } as any)
      ).toThrow('Invalid location type');
    });
  });

  describe('equals', () => {
    it('should return true for two backlog locations', () => {
      const loc1 = TaskLocation.backlog();
      const loc2 = TaskLocation.backlog();
      expect(loc1.equals(loc2)).toBe(true);
    });

    it('should return true for sprint locations with same ID', () => {
      const loc1 = TaskLocation.sprint('sprint-1');
      const loc2 = TaskLocation.sprint('sprint-1');
      expect(loc1.equals(loc2)).toBe(true);
    });

    it('should return false for sprint locations with different IDs', () => {
      const loc1 = TaskLocation.sprint('sprint-1');
      const loc2 = TaskLocation.sprint('sprint-2');
      expect(loc1.equals(loc2)).toBe(false);
    });

    it('should return false for backlog vs sprint', () => {
      const loc1 = TaskLocation.backlog();
      const loc2 = TaskLocation.sprint('sprint-1');
      expect(loc1.equals(loc2)).toBe(false);
    });
  });

  describe('toObject', () => {
    it('should serialize backlog location', () => {
      const location = TaskLocation.backlog();
      expect(location.toObject()).toEqual({ type: 'backlog' });
    });

    it('should serialize sprint location', () => {
      const location = TaskLocation.sprint('sprint-xyz');
      expect(location.toObject()).toEqual({
        type: 'sprint',
        sprintId: 'sprint-xyz'
      });
    });
  });
});
