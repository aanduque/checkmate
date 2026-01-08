/**
 * ActiveRoutineDeterminer Tests (TDD - Red Phase First)
 *
 * Per DEC-015: Routine Priority and Conflict Resolution
 * 1. Filter routines where activationExpression evaluates to true
 * 2. Select routine with highest priority (1-10 scale)
 * 3. If tie, select alphabetically by name
 * 4. If none match, return null
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ActiveRoutineDeterminer, RoutineContext } from '../../src/services/ActiveRoutineDeterminer';
import { Routine } from '../../src/entities/Routine';
import type { IFilterExpressionEvaluator, ICompiledFilter } from '../../src/ports/IFilterExpressionEvaluator';

// Mock implementation of IFilterExpressionEvaluator
class MockExpressionEvaluator implements IFilterExpressionEvaluator {
  private evaluations: Map<string, (ctx: Record<string, unknown>) => boolean> = new Map();

  setEvaluation(expression: string, result: (ctx: Record<string, unknown>) => boolean): void {
    this.evaluations.set(expression, result);
  }

  compile(expression: string): ICompiledFilter {
    const evalFn = this.evaluations.get(expression) ?? (() => false);
    return {
      evaluate: (context: Record<string, unknown>) => evalFn(context)
    };
  }

  validate(expression: string) {
    return { valid: true };
  }

  evaluate(expression: string, context: Record<string, unknown>): boolean {
    const evalFn = this.evaluations.get(expression);
    return evalFn ? evalFn(context) : false;
  }
}

describe('ActiveRoutineDeterminer', () => {
  let determiner: ActiveRoutineDeterminer;
  let mockEvaluator: MockExpressionEvaluator;

  beforeEach(() => {
    mockEvaluator = new MockExpressionEvaluator();
    determiner = new ActiveRoutineDeterminer(mockEvaluator);
  });

  const createRoutine = (overrides: Partial<{
    id: string;
    name: string;
    priority: number;
    activationExpression: string;
  }> = {}) => {
    return Routine.create({
      name: overrides.name ?? 'Test Routine',
      icon: 'star',
      color: 'blue',
      priority: overrides.priority ?? 5,
      taskFilterExpression: 'true',
      activationExpression: overrides.activationExpression ?? 'true'
    });
  };

  const createContext = (overrides: Partial<RoutineContext> = {}): RoutineContext => ({
    now: new Date('2025-01-15T10:30:00'),
    dayOfWeek: 'wed',
    hour: 10,
    minute: 30,
    isWeekday: true,
    isWeekend: false,
    ...overrides
  });

  describe('when no routines exist', () => {
    it('should return null', () => {
      const context = createContext();
      const result = determiner.determine([], context);
      expect(result).toBeNull();
    });
  });

  describe('when no routines match', () => {
    it('should return null', () => {
      const routine = createRoutine({ activationExpression: 'isWeekend' });
      mockEvaluator.setEvaluation('isWeekend', () => false);

      const context = createContext({ isWeekend: false });
      const result = determiner.determine([routine], context);
      expect(result).toBeNull();
    });
  });

  describe('when single routine matches', () => {
    it('should return that routine', () => {
      const routine = createRoutine({
        name: 'Work',
        activationExpression: 'isWeekday'
      });
      mockEvaluator.setEvaluation('isWeekday', (ctx) => ctx.isWeekday === true);

      const context = createContext({ isWeekday: true });
      const result = determiner.determine([routine], context);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Work');
    });
  });

  describe('when multiple routines match', () => {
    it('should return the one with highest priority', () => {
      const lowPriority = createRoutine({
        name: 'Low',
        priority: 3,
        activationExpression: 'isWeekday'
      });
      const highPriority = createRoutine({
        name: 'High',
        priority: 8,
        activationExpression: 'isWeekday and hour >= 9'
      });

      mockEvaluator.setEvaluation('isWeekday', (ctx) => ctx.isWeekday === true);
      mockEvaluator.setEvaluation('isWeekday and hour >= 9', (ctx) =>
        ctx.isWeekday === true && (ctx.hour as number) >= 9
      );

      const context = createContext({ isWeekday: true, hour: 10 });
      const result = determiner.determine([lowPriority, highPriority], context);

      expect(result?.name).toBe('High');
    });

    it('should handle priority ties by selecting alphabetically', () => {
      const routineA = createRoutine({
        name: 'Alpha',
        priority: 5,
        activationExpression: 'always'
      });
      const routineB = createRoutine({
        name: 'Beta',
        priority: 5,
        activationExpression: 'always'
      });

      mockEvaluator.setEvaluation('always', () => true);

      const context = createContext();
      const result = determiner.determine([routineB, routineA], context);

      expect(result?.name).toBe('Alpha');
    });
  });

  describe('with realistic time-based expressions', () => {
    it('should activate morning routine in the morning', () => {
      const morningRoutine = createRoutine({
        name: 'Morning',
        priority: 7,
        activationExpression: 'hour >= 6 and hour < 12'
      });
      const eveningRoutine = createRoutine({
        name: 'Evening',
        priority: 7,
        activationExpression: 'hour >= 18'
      });

      mockEvaluator.setEvaluation('hour >= 6 and hour < 12', (ctx) => {
        const h = ctx.hour as number;
        return h >= 6 && h < 12;
      });
      mockEvaluator.setEvaluation('hour >= 18', (ctx) => (ctx.hour as number) >= 18);

      const morningContext = createContext({ hour: 9 });
      const result = determiner.determine([morningRoutine, eveningRoutine], morningContext);

      expect(result?.name).toBe('Morning');
    });

    it('should activate weekend routine on weekends', () => {
      const workRoutine = createRoutine({
        name: 'Work',
        priority: 6,
        activationExpression: 'isWeekday'
      });
      const weekendRoutine = createRoutine({
        name: 'Weekend',
        priority: 6,
        activationExpression: 'isWeekend'
      });

      mockEvaluator.setEvaluation('isWeekday', (ctx) => ctx.isWeekday === true);
      mockEvaluator.setEvaluation('isWeekend', (ctx) => ctx.isWeekend === true);

      const weekendContext = createContext({ isWeekday: false, isWeekend: true, dayOfWeek: 'sat' });
      const result = determiner.determine([workRoutine, weekendRoutine], weekendContext);

      expect(result?.name).toBe('Weekend');
    });
  });

  describe('context building', () => {
    it('should build context from a Date', () => {
      // Wednesday, January 15, 2025, 14:30
      const date = new Date('2025-01-15T14:30:00');
      const context = ActiveRoutineDeterminer.buildContext(date);

      expect(context.hour).toBe(14);
      expect(context.minute).toBe(30);
      expect(context.dayOfWeek).toBe('wed');
      expect(context.isWeekday).toBe(true);
      expect(context.isWeekend).toBe(false);
    });

    it('should identify weekend correctly', () => {
      // Saturday, January 18, 2025
      const saturday = new Date('2025-01-18T10:00:00');
      const context = ActiveRoutineDeterminer.buildContext(saturday);

      expect(context.dayOfWeek).toBe('sat');
      expect(context.isWeekday).toBe(false);
      expect(context.isWeekend).toBe(true);
    });

    it('should identify Sunday correctly', () => {
      // Sunday, January 19, 2025
      const sunday = new Date('2025-01-19T10:00:00');
      const context = ActiveRoutineDeterminer.buildContext(sunday);

      expect(context.dayOfWeek).toBe('sun');
      expect(context.isWeekday).toBe(false);
      expect(context.isWeekend).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty activation expression gracefully', () => {
      // Create routine with empty expression (should be caught by validation, but test defensive handling)
      const routine = createRoutine({
        name: 'Test',
        activationExpression: ''
      });
      mockEvaluator.setEvaluation('', () => false);

      const context = createContext();
      const result = determiner.determine([routine], context);

      expect(result).toBeNull();
    });

    it('should handle expression evaluation errors gracefully', () => {
      const routine = createRoutine({
        name: 'Error Routine',
        activationExpression: 'invalid'
      });
      // Don't set any evaluation - will throw/return false

      const context = createContext();
      const result = determiner.determine([routine], context);

      expect(result).toBeNull();
    });
  });
});
