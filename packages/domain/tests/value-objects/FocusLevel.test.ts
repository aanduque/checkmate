import { describe, it, expect } from 'vitest';
import { FocusLevel, FOCUS_LEVELS } from '../../src/value-objects/FocusLevel';

describe('FocusLevel', () => {
  describe('FOCUS_LEVELS constant', () => {
    it('should contain distracted, neutral, and focused', () => {
      expect(FOCUS_LEVELS).toEqual(['distracted', 'neutral', 'focused']);
    });
  });

  describe('create', () => {
    it.each(FOCUS_LEVELS)('should accept valid level "%s"', (level) => {
      const focusLevel = FocusLevel.create(level);
      expect(focusLevel.value).toBe(level);
    });

    it('should reject invalid level', () => {
      expect(() => FocusLevel.create('invalid' as any)).toThrow(
        'Invalid focus level'
      );
    });

    it('should reject empty string', () => {
      expect(() => FocusLevel.create('' as any)).toThrow('Invalid focus level');
    });
  });

  describe('isDistracted', () => {
    it('should return true for distracted', () => {
      const focusLevel = FocusLevel.create('distracted');
      expect(focusLevel.isDistracted()).toBe(true);
    });

    it('should return false for other levels', () => {
      expect(FocusLevel.create('neutral').isDistracted()).toBe(false);
      expect(FocusLevel.create('focused').isDistracted()).toBe(false);
    });
  });

  describe('isNeutral', () => {
    it('should return true for neutral', () => {
      const focusLevel = FocusLevel.create('neutral');
      expect(focusLevel.isNeutral()).toBe(true);
    });

    it('should return false for other levels', () => {
      expect(FocusLevel.create('distracted').isNeutral()).toBe(false);
      expect(FocusLevel.create('focused').isNeutral()).toBe(false);
    });
  });

  describe('isFocused', () => {
    it('should return true for focused', () => {
      const focusLevel = FocusLevel.create('focused');
      expect(focusLevel.isFocused()).toBe(true);
    });

    it('should return false for other levels', () => {
      expect(FocusLevel.create('distracted').isFocused()).toBe(false);
      expect(FocusLevel.create('neutral').isFocused()).toBe(false);
    });
  });

  describe('isPositive', () => {
    it('should return true for focused', () => {
      expect(FocusLevel.create('focused').isPositive()).toBe(true);
    });

    it('should return false for distracted and neutral', () => {
      expect(FocusLevel.create('distracted').isPositive()).toBe(false);
      expect(FocusLevel.create('neutral').isPositive()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same level', () => {
      const level1 = FocusLevel.create('focused');
      const level2 = FocusLevel.create('focused');
      expect(level1.equals(level2)).toBe(true);
    });

    it('should return false for different levels', () => {
      const level1 = FocusLevel.create('focused');
      const level2 = FocusLevel.create('distracted');
      expect(level1.equals(level2)).toBe(false);
    });
  });
});
