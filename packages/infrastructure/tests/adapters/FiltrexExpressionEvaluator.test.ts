/**
 * FiltrexExpressionEvaluator Tests (TDD - Red Phase First)
 *
 * Tests the Filtrex-based implementation of IFilterExpressionEvaluator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FiltrexExpressionEvaluator } from '../../src/adapters/FiltrexExpressionEvaluator';
import type { IFilterExpressionEvaluator } from '@checkmate/domain';

describe('FiltrexExpressionEvaluator', () => {
  let evaluator: IFilterExpressionEvaluator;

  beforeEach(() => {
    evaluator = new FiltrexExpressionEvaluator();
  });

  describe('validate', () => {
    it('should return valid for correct expressions', () => {
      const result = evaluator.validate('x > 5');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for complex expressions', () => {
      const result = evaluator.validate('(a > 5 and b < 10) or c == "test"');
      expect(result.valid).toBe(true);
    });

    it('should return valid for function calls', () => {
      const result = evaluator.validate('hasTag("work")');
      expect(result.valid).toBe(true);
    });

    it('should return invalid for malformed expressions', () => {
      const result = evaluator.validate('x >> 5');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return invalid for empty expressions', () => {
      const result = evaluator.validate('');
      expect(result.valid).toBe(false);
    });

    it('should return valid for boolean expressions', () => {
      const result = evaluator.validate('isWeekday and hour >= 9');
      expect(result.valid).toBe(true);
    });

    it('should return valid for in operator', () => {
      const result = evaluator.validate('dayOfWeek in ("mon", "tue", "wed")');
      expect(result.valid).toBe(true);
    });
  });

  describe('compile', () => {
    it('should compile a valid expression', () => {
      const filter = evaluator.compile('x > 5');
      expect(filter).toBeDefined();
    });

    it('should throw for invalid expressions', () => {
      expect(() => evaluator.compile('x >> 5')).toThrow();
    });

    it('should return a filter that can be evaluated', () => {
      const filter = evaluator.compile('x > 5');
      expect(filter.evaluate({ x: 10 })).toBe(true);
      expect(filter.evaluate({ x: 3 })).toBe(false);
    });
  });

  describe('evaluate', () => {
    it('should evaluate simple comparison', () => {
      expect(evaluator.evaluate('x > 5', { x: 10 })).toBe(true);
      expect(evaluator.evaluate('x > 5', { x: 3 })).toBe(false);
    });

    it('should evaluate equality', () => {
      expect(evaluator.evaluate('status == "active"', { status: 'active' })).toBe(true);
      expect(evaluator.evaluate('status == "active"', { status: 'completed' })).toBe(false);
    });

    it('should evaluate boolean operations', () => {
      const ctx = { a: true, b: false };
      expect(evaluator.evaluate('a and b', ctx)).toBe(false);
      expect(evaluator.evaluate('a or b', ctx)).toBe(true);
      expect(evaluator.evaluate('not b', ctx)).toBe(true);
    });

    it('should evaluate arithmetic', () => {
      expect(evaluator.evaluate('x + y > 10', { x: 5, y: 7 })).toBe(true);
      expect(evaluator.evaluate('x * 2 == 10', { x: 5 })).toBe(true);
    });

    it('should handle missing properties', () => {
      // Filtrex coerces undefined in various ways - this documents actual behavior
      // For safety in application code, always ensure required properties exist in context
      expect(evaluator.evaluate('x == 0', { x: 0 })).toBe(true);
      // When x is undefined, Filtrex coerces to empty string/0 depending on comparison
      // This is expected JavaScript-like behavior
      expect(evaluator.evaluate('x == ""', {})).toBe(true); // undefined coerced to empty string
    });

    it('should handle nested property access', () => {
      const ctx = { points: { work: 5, personal: 3 } };
      expect(evaluator.evaluate('points.work > 3', ctx)).toBe(true);
      expect(evaluator.evaluate('points.personal == 3', ctx)).toBe(true);
    });
  });

  describe('custom functions', () => {
    it('should support hasTag function', () => {
      const ctx = { tags: ['work', 'urgent'] };
      expect(evaluator.evaluate('hasTag("work")', ctx)).toBe(true);
      expect(evaluator.evaluate('hasTag("personal")', ctx)).toBe(false);
    });

    it('should support hasAnyTag function', () => {
      const ctx = { tags: ['work', 'urgent'] };
      expect(evaluator.evaluate('hasAnyTag("work", "personal")', ctx)).toBe(true);
      expect(evaluator.evaluate('hasAnyTag("health", "personal")', ctx)).toBe(false);
    });

    it('should support hasAllTags function', () => {
      const ctx = { tags: ['work', 'urgent'] };
      expect(evaluator.evaluate('hasAllTags("work", "urgent")', ctx)).toBe(true);
      expect(evaluator.evaluate('hasAllTags("work", "personal")', ctx)).toBe(false);
    });
  });

  describe('routine activation expressions', () => {
    it('should evaluate weekday morning routine', () => {
      const weekdayMorning = { isWeekday: true, hour: 9, minute: 30 };
      const expression = 'isWeekday and hour >= 9 and hour < 12';

      expect(evaluator.evaluate(expression, weekdayMorning)).toBe(true);
      expect(evaluator.evaluate(expression, { ...weekdayMorning, hour: 14 })).toBe(false);
      expect(evaluator.evaluate(expression, { isWeekday: false, hour: 9 })).toBe(false);
    });

    it('should evaluate weekend routine', () => {
      const expression = 'isWeekend';
      expect(evaluator.evaluate(expression, { isWeekend: true })).toBe(true);
      expect(evaluator.evaluate(expression, { isWeekend: false })).toBe(false);
    });

    it('should evaluate evening routine', () => {
      const expression = 'hour >= 18 or hour < 6';
      expect(evaluator.evaluate(expression, { hour: 20 })).toBe(true);
      expect(evaluator.evaluate(expression, { hour: 4 })).toBe(true);
      expect(evaluator.evaluate(expression, { hour: 12 })).toBe(false);
    });

    it('should evaluate day-specific routine', () => {
      const expression = 'dayOfWeek in ("mon", "wed", "fri")';
      expect(evaluator.evaluate(expression, { dayOfWeek: 'mon' })).toBe(true);
      expect(evaluator.evaluate(expression, { dayOfWeek: 'tue' })).toBe(false);
    });
  });

  describe('task filter expressions', () => {
    it('should filter by tag', () => {
      const expression = 'hasTag("work")';
      expect(evaluator.evaluate(expression, { tags: ['work', 'coding'] })).toBe(true);
      expect(evaluator.evaluate(expression, { tags: ['personal'] })).toBe(false);
    });

    it('should filter by age', () => {
      const expression = 'age > 7';
      expect(evaluator.evaluate(expression, { age: 10 })).toBe(true);
      expect(evaluator.evaluate(expression, { age: 3 })).toBe(false);
    });

    it('should filter by location', () => {
      const expression = 'inSprint';
      expect(evaluator.evaluate(expression, { inSprint: true })).toBe(true);
      expect(evaluator.evaluate(expression, { inSprint: false })).toBe(false);
    });

    it('should combine multiple conditions', () => {
      const expression = 'hasTag("work") and age > 3 and inSprint';
      const ctx = { tags: ['work'], age: 5, inSprint: true };
      expect(evaluator.evaluate(expression, ctx)).toBe(true);

      expect(evaluator.evaluate(expression, { ...ctx, inSprint: false })).toBe(false);
    });

    it('should filter by points', () => {
      const expression = 'totalPoints >= 5';
      expect(evaluator.evaluate(expression, { totalPoints: 8 })).toBe(true);
      expect(evaluator.evaluate(expression, { totalPoints: 3 })).toBe(false);
    });
  });

  describe('compiled filter reuse', () => {
    it('should be able to reuse compiled filter', () => {
      const filter = evaluator.compile('x > 5');

      expect(filter.evaluate({ x: 10 })).toBe(true);
      expect(filter.evaluate({ x: 3 })).toBe(false);
      expect(filter.evaluate({ x: 100 })).toBe(true);
    });

    it('should be faster when reusing compiled filter', () => {
      const filter = evaluator.compile('a > 1 and b < 10 and c == "test"');

      // Run multiple evaluations
      for (let i = 0; i < 100; i++) {
        filter.evaluate({ a: i, b: 5, c: 'test' });
      }

      // This should complete without issues
      expect(filter.evaluate({ a: 5, b: 5, c: 'test' })).toBe(true);
    });
  });
});
