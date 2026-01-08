import { compileExpression } from 'filtrex';
import { Task, RoutineContext } from '@checkmate/domain';

export interface TaskFilterContext {
  title: string;
  description: string;
  status: string;
  age: number;
  sprintCount: number;
  inBacklog: boolean;
  inSprint: boolean;
  points: number;
  tagNames: string[];
}

/**
 * Service for evaluating filter expressions using Filtrex
 */
export class FilterExpressionEvaluator {
  private compiledFilters: Map<string, (data: any) => any> = new Map();

  /**
   * Evaluate a task filter expression
   */
  evaluateTaskFilter(expression: string, context: TaskFilterContext): boolean {
    if (!expression || expression.trim() === '' || expression === 'true') {
      return true;
    }
    if (expression === 'false') {
      return false;
    }

    try {
      const filter = this.getOrCompileFilter(expression, this.getTaskFilterFunctions(context));
      return Boolean(filter(context));
    } catch (e) {
      console.error('Task filter eval error:', e, expression);
      return true; // Default to true on error
    }
  }

  /**
   * Evaluate a routine activation expression
   */
  evaluateActivationExpression(
    expression: string,
    context: RoutineContext
  ): boolean {
    if (!expression || expression.trim() === '' || expression === 'false') {
      return false;
    }
    if (expression === 'true') {
      return true;
    }

    try {
      const filter = this.getOrCompileFilter(expression, {});
      return Boolean(filter(context));
    } catch (e) {
      console.error('Activation eval error:', e, expression);
      return false;
    }
  }

  /**
   * Build task filter context from a Task entity
   */
  buildTaskContext(task: Task, tagNamesById: Map<string, string>): TaskFilterContext {
    const tagIds = task.tagPoints.getTagIds();
    const tagNames = tagIds
      .map((id) => tagNamesById.get(id.toString())?.toLowerCase())
      .filter((n): n is string => !!n);

    return {
      title: task.title,
      description: task.description,
      status: task.status,
      age: task.getAge(),
      sprintCount: task.sprintHistory.length,
      inBacklog: task.location.isBacklog(),
      inSprint: task.location.isSprint(),
      points: task.tagPoints.getTotalPoints(),
      tagNames,
    };
  }

  /**
   * Validate an expression without evaluating it
   */
  validate(expression: string): { valid: boolean; error?: string } {
    try {
      compileExpression(this.normalizeExpression(expression));
      return { valid: true };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  private getTaskFilterFunctions(context: TaskFilterContext) {
    return {
      hasTag: (name: string) =>
        context.tagNames.includes(name.toLowerCase()),
      hasAnyTag: (...names: string[]) =>
        names.some((n) => context.tagNames.includes(n.toLowerCase())),
      hasAllTags: (...names: string[]) =>
        names.every((n) => context.tagNames.includes(n.toLowerCase())),
    };
  }

  private getOrCompileFilter(
    expression: string,
    extraFunctions: Record<string, Function>
  ): (data: any) => any {
    const cacheKey = expression + JSON.stringify(Object.keys(extraFunctions));

    if (!this.compiledFilters.has(cacheKey)) {
      const normalized = this.normalizeExpression(expression);
      const compiled = compileExpression(normalized, {
        extraFunctions: extraFunctions as any,
      });
      this.compiledFilters.set(cacheKey, compiled);
    }

    return this.compiledFilters.get(cacheKey)!;
  }

  private normalizeExpression(expression: string): string {
    return expression
      .replace(/\band\b/gi, ' and ')
      .replace(/\bor\b/gi, ' or ')
      .replace(/\bnot\b/gi, ' not ');
  }
}
