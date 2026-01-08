/**
 * ActiveRoutineDeterminer - Domain service for determining active routine
 *
 * Per DEC-015: Routine Priority and Conflict Resolution
 * 1. Filter routines where activationExpression evaluates to true
 * 2. Select routine with highest priority (1-10 scale)
 * 3. If tie, select alphabetically by name
 * 4. If none match, return null (default "show all" behavior)
 */

import { Routine } from '../entities/Routine';
import type { IFilterExpressionEvaluator } from '../ports/IFilterExpressionEvaluator';

/**
 * Context available for evaluating routine activation expressions
 */
export interface RoutineContext {
  now: Date;
  dayOfWeek: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat';
  hour: number;  // 0-23
  minute: number;  // 0-59
  isWeekday: boolean;
  isWeekend: boolean;
}

const DAY_NAMES: RoutineContext['dayOfWeek'][] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Domain service that determines which routine is currently active
 */
export class ActiveRoutineDeterminer {
  constructor(private readonly expressionEvaluator: IFilterExpressionEvaluator) {}

  /**
   * Determine which routine is active given the current context
   * Returns null if no routines match
   */
  determine(routines: Routine[], context: RoutineContext): Routine | null {
    if (routines.length === 0) {
      return null;
    }

    // Convert context to evaluation context (plain object for Filtrex)
    const evalContext: Record<string, unknown> = {
      now: context.now,
      dayOfWeek: context.dayOfWeek,
      hour: context.hour,
      minute: context.minute,
      isWeekday: context.isWeekday,
      isWeekend: context.isWeekend,
      // Compute time as minutes since midnight for easier range comparisons
      time: context.hour * 60 + context.minute
    };

    // Filter routines where activation expression evaluates to true
    const matchingRoutines = routines.filter(routine => {
      try {
        const expression = routine.activationExpression;
        if (!expression || expression.trim() === '') {
          return false;
        }
        return this.expressionEvaluator.evaluate(expression, evalContext);
      } catch {
        // If expression evaluation fails, routine doesn't match
        return false;
      }
    });

    if (matchingRoutines.length === 0) {
      return null;
    }

    // Sort by priority (descending), then by name (ascending) for ties
    matchingRoutines.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      // Alphabetical tie-breaker
      return a.name.localeCompare(b.name);
    });

    return matchingRoutines[0];
  }

  /**
   * Build a RoutineContext from a Date
   */
  static buildContext(date: Date): RoutineContext {
    const dayIndex = date.getDay();
    const dayOfWeek = DAY_NAMES[dayIndex];
    const isWeekend = dayIndex === 0 || dayIndex === 6;

    return {
      now: date,
      dayOfWeek,
      hour: date.getHours(),
      minute: date.getMinutes(),
      isWeekday: !isWeekend,
      isWeekend
    };
  }
}
