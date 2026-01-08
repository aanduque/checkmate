import { describe, it, expect, beforeEach } from 'vitest';
import { FilterExpressionEvaluator, TaskFilterContext } from '../../src/services/FilterExpressionEvaluator';

describe('FilterExpressionEvaluator', () => {
  let evaluator: FilterExpressionEvaluator;

  beforeEach(() => {
    evaluator = new FilterExpressionEvaluator();
  });

  describe('evaluateTaskFilter', () => {
    const baseContext: TaskFilterContext = {
      title: 'Test task',
      description: 'A test description',
      status: 'active',
      age: 5,
      sprintCount: 2,
      inBacklog: false,
      inSprint: true,
      points: 8,
      tagNames: ['work', 'important'],
    };

    it('should return true for empty expression', () => {
      expect(evaluator.evaluateTaskFilter('', baseContext)).toBe(true);
    });

    it('should return true for "true" expression', () => {
      expect(evaluator.evaluateTaskFilter('true', baseContext)).toBe(true);
    });

    it('should return false for "false" expression', () => {
      expect(evaluator.evaluateTaskFilter('false', baseContext)).toBe(false);
    });

    describe('hasTag function', () => {
      it('should return true when task has the tag', () => {
        expect(evaluator.evaluateTaskFilter('hasTag("work")', baseContext)).toBe(true);
      });

      it('should return false when task does not have the tag', () => {
        expect(evaluator.evaluateTaskFilter('hasTag("personal")', baseContext)).toBe(false);
      });

      it('should be case-insensitive', () => {
        expect(evaluator.evaluateTaskFilter('hasTag("WORK")', baseContext)).toBe(true);
        expect(evaluator.evaluateTaskFilter('hasTag("Work")', baseContext)).toBe(true);
      });
    });

    describe('hasAnyTag function', () => {
      it('should return true when task has any of the tags', () => {
        expect(evaluator.evaluateTaskFilter('hasAnyTag("work", "personal")', baseContext)).toBe(true);
      });

      it('should return false when task has none of the tags', () => {
        expect(evaluator.evaluateTaskFilter('hasAnyTag("personal", "health")', baseContext)).toBe(false);
      });
    });

    describe('hasAllTags function', () => {
      it('should return true when task has all tags', () => {
        expect(evaluator.evaluateTaskFilter('hasAllTags("work", "important")', baseContext)).toBe(true);
      });

      it('should return false when task is missing a tag', () => {
        expect(evaluator.evaluateTaskFilter('hasAllTags("work", "personal")', baseContext)).toBe(false);
      });
    });

    describe('context variables', () => {
      it('should evaluate age condition', () => {
        expect(evaluator.evaluateTaskFilter('age < 7', baseContext)).toBe(true);
        expect(evaluator.evaluateTaskFilter('age > 10', baseContext)).toBe(false);
      });

      it('should evaluate points condition', () => {
        expect(evaluator.evaluateTaskFilter('points >= 5', baseContext)).toBe(true);
        expect(evaluator.evaluateTaskFilter('points == 8', baseContext)).toBe(true);
      });

      it('should evaluate sprintCount condition', () => {
        expect(evaluator.evaluateTaskFilter('sprintCount > 0', baseContext)).toBe(true);
        expect(evaluator.evaluateTaskFilter('sprintCount == 2', baseContext)).toBe(true);
      });

      it('should evaluate inBacklog condition', () => {
        expect(evaluator.evaluateTaskFilter('inBacklog', { ...baseContext, inBacklog: true, inSprint: false })).toBe(true);
        expect(evaluator.evaluateTaskFilter('inBacklog', baseContext)).toBe(false);
      });

      it('should evaluate inSprint condition', () => {
        expect(evaluator.evaluateTaskFilter('inSprint', baseContext)).toBe(true);
        expect(evaluator.evaluateTaskFilter('inSprint', { ...baseContext, inSprint: false })).toBe(false);
      });
    });

    describe('combined expressions', () => {
      it('should evaluate AND expressions', () => {
        expect(evaluator.evaluateTaskFilter('hasTag("work") and age < 10', baseContext)).toBe(true);
        expect(evaluator.evaluateTaskFilter('hasTag("personal") and age < 10', baseContext)).toBe(false);
      });

      it('should evaluate OR expressions', () => {
        expect(evaluator.evaluateTaskFilter('hasTag("work") or hasTag("personal")', baseContext)).toBe(true);
        expect(evaluator.evaluateTaskFilter('hasTag("health") or hasTag("personal")', baseContext)).toBe(false);
      });

      it('should evaluate complex expressions', () => {
        expect(evaluator.evaluateTaskFilter(
          '(hasTag("work") or hasTag("personal")) and age < 7',
          baseContext
        )).toBe(true);
      });
    });

    describe('error handling', () => {
      it('should return true on invalid expression (fail-safe)', () => {
        expect(evaluator.evaluateTaskFilter('invalid_function()', baseContext)).toBe(true);
      });
    });
  });

  describe('evaluateActivationExpression', () => {
    const baseContext = {
      hour: 14,
      minute: 30,
      dayOfWeek: 'mon',
      isWeekday: true,
      isWeekend: false,
      date: 15,
      month: 1,
      year: 2024,
      time: 870, // 14:30 = 14*60 + 30
    };

    it('should return false for empty expression', () => {
      expect(evaluator.evaluateActivationExpression('', baseContext)).toBe(false);
    });

    it('should return false for "false" expression', () => {
      expect(evaluator.evaluateActivationExpression('false', baseContext)).toBe(false);
    });

    it('should return true for "true" expression', () => {
      expect(evaluator.evaluateActivationExpression('true', baseContext)).toBe(true);
    });

    it('should evaluate time-based conditions', () => {
      expect(evaluator.evaluateActivationExpression('hour >= 9 and hour < 18', baseContext)).toBe(true);
      expect(evaluator.evaluateActivationExpression('hour < 9', baseContext)).toBe(false);
    });

    it('should evaluate weekday conditions', () => {
      expect(evaluator.evaluateActivationExpression('isWeekday', baseContext)).toBe(true);
      expect(evaluator.evaluateActivationExpression('isWeekend', baseContext)).toBe(false);
    });

    it('should evaluate complex work hours expression', () => {
      // Typical work hours routine: weekday 9am-6pm
      expect(evaluator.evaluateActivationExpression(
        'isWeekday and hour >= 9 and hour < 18',
        baseContext
      )).toBe(true);

      // Same expression on weekend should be false
      expect(evaluator.evaluateActivationExpression(
        'isWeekday and hour >= 9 and hour < 18',
        { ...baseContext, isWeekday: false, isWeekend: true }
      )).toBe(false);
    });

    it('should evaluate evening routine expression', () => {
      const eveningContext = { ...baseContext, hour: 20 };
      expect(evaluator.evaluateActivationExpression('hour >= 18', eveningContext)).toBe(true);
    });

    describe('error handling', () => {
      it('should handle malformed expressions gracefully', () => {
        // Filtrex may treat unknown functions as truthy values
        // The key is that it doesn't throw/crash
        const result = evaluator.evaluateActivationExpression('((((', baseContext);
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('validate', () => {
    it('should return valid for correct expressions', () => {
      expect(evaluator.validate('age > 5').valid).toBe(true);
      expect(evaluator.validate('a and b').valid).toBe(true);
    });

    it('should return invalid for syntax errors', () => {
      const result = evaluator.validate('age >>>> 5');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
