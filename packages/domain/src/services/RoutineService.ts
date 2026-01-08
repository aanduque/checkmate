import { Routine } from '../entities/Routine';

export interface RoutineContext {
  now: Date;
  dayOfWeek: string;
  hour: number;
  minute: number;
  date: number;
  month: number;
  year: number;
  isWeekday: boolean;
  isWeekend: boolean;
  time: number;
}

export type ActivationEvaluator = (
  expression: string,
  context: RoutineContext
) => boolean;

/**
 * Domain service for routine management
 */
export class RoutineService {
  private static readonly DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  /**
   * Build activation context from a date
   */
  buildContext(now: Date = new Date()): RoutineContext {
    const day = now.getDay();
    return {
      now,
      dayOfWeek: RoutineService.DAYS[day],
      hour: now.getHours(),
      minute: now.getMinutes(),
      date: now.getDate(),
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      isWeekday: day > 0 && day < 6,
      isWeekend: day === 0 || day === 6,
      time: now.getHours() * 60 + now.getMinutes(),
    };
  }

  /**
   * Determine which routine should be active
   * If evaluator is provided, uses it to evaluate activation expressions
   * Returns null if no routine matches
   */
  determineActiveRoutine(
    routines: Routine[],
    context: RoutineContext,
    evaluator?: ActivationEvaluator
  ): Routine | null {
    // Filter routines where activation expression evaluates to true
    const matching = routines.filter((routine) => {
      const expr = routine.activationExpression;
      if (!expr || expr.trim() === '' || expr === 'false') return false;
      if (expr === 'true') return true;

      // If we have an evaluator, use it
      if (evaluator) {
        try {
          return evaluator(expr, context);
        } catch {
          return false;
        }
      }

      // Without evaluator, we can't evaluate the expression
      return false;
    });

    if (matching.length === 0) return null;

    // Sort by priority (descending), then name (ascending)
    matching.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.name.localeCompare(b.name);
    });

    return matching[0];
  }
}
