import { describe, it, expect } from 'vitest';
import { TagPoints } from '../../src/value-objects/TagPoints';

describe('TagPoints', () => {
  describe('create', () => {
    it('should create TagPoints from a valid map', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3, 'tag-2': 5 });
      expect(tagPoints.getValue('tag-1')).toBe(3);
      expect(tagPoints.getValue('tag-2')).toBe(5);
    });

    it('should throw error for empty map', () => {
      expect(() => TagPoints.create({})).toThrow(
        'Task must have at least one tag with points'
      );
    });

    it('should throw error for invalid Fibonacci points', () => {
      expect(() => TagPoints.create({ 'tag-1': 4 })).toThrow(
        'Points must be a valid Fibonacci number'
      );
    });

    it('should throw error for zero points', () => {
      expect(() => TagPoints.create({ 'tag-1': 0 })).toThrow(
        'Points must be a valid Fibonacci number'
      );
    });

    it('should throw error for negative points', () => {
      expect(() => TagPoints.create({ 'tag-1': -1 })).toThrow(
        'Points must be a valid Fibonacci number'
      );
    });

    it('should accept all Fibonacci values', () => {
      const tagPoints = TagPoints.create({
        'tag-1': 1,
        'tag-2': 2,
        'tag-3': 3,
        'tag-5': 5,
        'tag-8': 8,
        'tag-13': 13,
        'tag-21': 21
      });
      expect(tagPoints.totalPoints()).toBe(1 + 2 + 3 + 5 + 8 + 13 + 21);
    });
  });

  describe('getValue', () => {
    it('should return points for existing tag', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 5 });
      expect(tagPoints.getValue('tag-1')).toBe(5);
    });

    it('should return 0 for non-existing tag', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 5 });
      expect(tagPoints.getValue('tag-2')).toBe(0);
    });
  });

  describe('hasTag', () => {
    it('should return true for existing tag', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 5 });
      expect(tagPoints.hasTag('tag-1')).toBe(true);
    });

    it('should return false for non-existing tag', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 5 });
      expect(tagPoints.hasTag('tag-2')).toBe(false);
    });
  });

  describe('tagIds', () => {
    it('should return all tag IDs', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3, 'tag-2': 5 });
      const ids = tagPoints.tagIds();
      expect(ids).toContain('tag-1');
      expect(ids).toContain('tag-2');
      expect(ids.length).toBe(2);
    });
  });

  describe('totalPoints', () => {
    it('should return sum of all points', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3, 'tag-2': 5, 'tag-3': 8 });
      expect(tagPoints.totalPoints()).toBe(16);
    });

    it('should return points for single tag', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 13 });
      expect(tagPoints.totalPoints()).toBe(13);
    });
  });

  describe('tagCount', () => {
    it('should return number of tags', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3, 'tag-2': 5 });
      expect(tagPoints.tagCount()).toBe(2);
    });
  });

  describe('toRecord', () => {
    it('should return a plain object', () => {
      const input = { 'tag-1': 3, 'tag-2': 5 };
      const tagPoints = TagPoints.create(input);
      expect(tagPoints.toRecord()).toEqual(input);
    });

    it('should return a copy, not the original', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3 });
      const record = tagPoints.toRecord();
      record['tag-1'] = 100;
      expect(tagPoints.getValue('tag-1')).toBe(3);
    });
  });

  describe('withTag', () => {
    it('should add a new tag with points', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3 });
      const updated = tagPoints.withTag('tag-2', 5);
      expect(updated.getValue('tag-2')).toBe(5);
      expect(updated.tagCount()).toBe(2);
    });

    it('should update existing tag points', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3 });
      const updated = tagPoints.withTag('tag-1', 8);
      expect(updated.getValue('tag-1')).toBe(8);
      expect(updated.tagCount()).toBe(1);
    });

    it('should not mutate original', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3 });
      tagPoints.withTag('tag-2', 5);
      expect(tagPoints.hasTag('tag-2')).toBe(false);
    });

    it('should throw for invalid points', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3 });
      expect(() => tagPoints.withTag('tag-2', 4)).toThrow();
    });
  });

  describe('withoutTag', () => {
    it('should remove a tag', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3, 'tag-2': 5 });
      const updated = tagPoints.withoutTag('tag-1');
      expect(updated.hasTag('tag-1')).toBe(false);
      expect(updated.hasTag('tag-2')).toBe(true);
    });

    it('should throw if removing last tag', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3 });
      expect(() => tagPoints.withoutTag('tag-1')).toThrow(
        'Task must have at least one tag with points'
      );
    });

    it('should not mutate original', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3, 'tag-2': 5 });
      tagPoints.withoutTag('tag-1');
      expect(tagPoints.hasTag('tag-1')).toBe(true);
    });

    it('should handle removing non-existent tag gracefully', () => {
      const tagPoints = TagPoints.create({ 'tag-1': 3 });
      const updated = tagPoints.withoutTag('tag-2');
      expect(updated.tagCount()).toBe(1);
    });
  });

  describe('equals', () => {
    it('should return true for identical TagPoints', () => {
      const tp1 = TagPoints.create({ 'tag-1': 3, 'tag-2': 5 });
      const tp2 = TagPoints.create({ 'tag-1': 3, 'tag-2': 5 });
      expect(tp1.equals(tp2)).toBe(true);
    });

    it('should return false for different tag IDs', () => {
      const tp1 = TagPoints.create({ 'tag-1': 3 });
      const tp2 = TagPoints.create({ 'tag-2': 3 });
      expect(tp1.equals(tp2)).toBe(false);
    });

    it('should return false for different points', () => {
      const tp1 = TagPoints.create({ 'tag-1': 3 });
      const tp2 = TagPoints.create({ 'tag-1': 5 });
      expect(tp1.equals(tp2)).toBe(false);
    });
  });
});
