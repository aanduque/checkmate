import { describe, it, expect } from 'vitest';
import { SkipState } from '../../src/value-objects/SkipState';

describe('SkipState', () => {
  describe('forNow', () => {
    it('should create a for_now skip state', () => {
      const skipState = SkipState.forNow();
      expect(skipState.type).toBe('for_now');
      expect(skipState.isForNow()).toBe(true);
      expect(skipState.isForDay()).toBe(false);
    });

    it('should set skippedAt to approximately current time', () => {
      const before = new Date();
      const skipState = SkipState.forNow();
      const after = new Date();

      expect(skipState.skippedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(skipState.skippedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should not have returnAt', () => {
      const skipState = SkipState.forNow();
      expect(skipState.returnAt).toBeUndefined();
    });

    it('should not have justificationCommentId', () => {
      const skipState = SkipState.forNow();
      expect(skipState.justificationCommentId).toBeUndefined();
    });
  });

  describe('forDay', () => {
    it('should create a for_day skip state', () => {
      const skipState = SkipState.forDay('comment-123');
      expect(skipState.type).toBe('for_day');
      expect(skipState.isForDay()).toBe(true);
      expect(skipState.isForNow()).toBe(false);
    });

    it('should set skippedAt to approximately current time', () => {
      const before = new Date();
      const skipState = SkipState.forDay('comment-123');
      const after = new Date();

      expect(skipState.skippedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(skipState.skippedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should set returnAt to start of next day UTC', () => {
      const skipState = SkipState.forDay('comment-123');
      const returnAt = skipState.returnAt!;

      // Should be tomorrow at midnight UTC
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);

      expect(returnAt.toISOString()).toBe(tomorrow.toISOString());
    });

    it('should set justificationCommentId', () => {
      const skipState = SkipState.forDay('comment-123');
      expect(skipState.justificationCommentId).toBe('comment-123');
    });

    it('should throw for empty justificationCommentId', () => {
      expect(() => SkipState.forDay('')).toThrow(
        'Justification comment ID is required for skip for day'
      );
    });
  });

  describe('shouldReturn', () => {
    it('should return false for for_now', () => {
      const skipState = SkipState.forNow();
      expect(skipState.shouldReturn(new Date())).toBe(false);
    });

    it('should return false for for_day before returnAt', () => {
      const skipState = SkipState.forDay('comment-123');
      // Use current time (which is before tomorrow)
      expect(skipState.shouldReturn(new Date())).toBe(false);
    });

    it('should return true for for_day at or after returnAt', () => {
      const skipState = SkipState.forDay('comment-123');
      // Create a time that's definitely after returnAt (2 days from now)
      const futureDate = new Date();
      futureDate.setUTCDate(futureDate.getUTCDate() + 2);
      expect(skipState.shouldReturn(futureDate)).toBe(true);
    });
  });

  describe('markReturned', () => {
    it('should create a new skip state with returned flag', () => {
      const skipState = SkipState.forDay('comment-123');
      const returned = skipState.markReturned();
      expect(returned.returned).toBe(true);
    });

    it('should not mutate original', () => {
      const skipState = SkipState.forDay('comment-123');
      skipState.markReturned();
      expect(skipState.returned).toBe(false);
    });

    it('should preserve other properties', () => {
      const skipState = SkipState.forDay('comment-123');
      const returned = skipState.markReturned();
      expect(returned.type).toBe('for_day');
      expect(returned.justificationCommentId).toBe('comment-123');
    });
  });

  describe('fromObject', () => {
    it('should recreate for_now state', () => {
      const obj = {
        type: 'for_now' as const,
        skippedAt: '2025-01-15T10:00:00Z'
      };
      const skipState = SkipState.fromObject(obj);
      expect(skipState.isForNow()).toBe(true);
      expect(skipState.skippedAt).toEqual(new Date('2025-01-15T10:00:00Z'));
    });

    it('should recreate for_day state', () => {
      const obj = {
        type: 'for_day' as const,
        skippedAt: '2025-01-15T10:00:00Z',
        returnAt: '2025-01-16T00:00:00Z',
        justificationCommentId: 'comment-456',
        returned: true
      };
      const skipState = SkipState.fromObject(obj);
      expect(skipState.isForDay()).toBe(true);
      expect(skipState.returnAt).toEqual(new Date('2025-01-16T00:00:00Z'));
      expect(skipState.justificationCommentId).toBe('comment-456');
      expect(skipState.returned).toBe(true);
    });
  });

  describe('toObject', () => {
    it('should serialize for_now state', () => {
      const skipState = SkipState.forNow();
      const obj = skipState.toObject();
      expect(obj.type).toBe('for_now');
      expect(obj.skippedAt).toBeDefined();
      // Verify it's a valid ISO string
      expect(new Date(obj.skippedAt).toISOString()).toBe(obj.skippedAt);
    });

    it('should serialize for_day state', () => {
      const skipState = SkipState.forDay('comment-789');
      const obj = skipState.toObject();
      expect(obj.type).toBe('for_day');
      expect(obj.justificationCommentId).toBe('comment-789');
      expect(obj.returnAt).toBeDefined();
      // Verify returnAt is a valid ISO string
      expect(new Date(obj.returnAt!).toISOString()).toBe(obj.returnAt);
    });
  });
});
