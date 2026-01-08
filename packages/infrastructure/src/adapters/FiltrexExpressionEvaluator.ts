/**
 * FiltrexExpressionEvaluator - Adapter implementing IFilterExpressionEvaluator
 *
 * Per DEC-007 (Filtrex) and DEC-024 (Hexagonal Architecture):
 * - Implements the domain port interface
 * - Uses Filtrex library for safe expression evaluation
 * - Provides custom functions for domain-specific operations
 */

import { compileExpression } from 'filtrex';
import type {
  IFilterExpressionEvaluator,
  ICompiledFilter,
  ValidationResult
} from '@checkmate/domain';

/**
 * Create context-aware functions that close over the evaluation context
 */
function createContextFunctions(context: Record<string, unknown>): Record<string, (...args: unknown[]) => unknown> {
  const tags = context.tags as string[] | undefined;

  return {
    /**
     * Check if context has a specific tag
     * Usage: hasTag("work")
     */
    hasTag: (tagName: unknown): boolean => {
      if (!Array.isArray(tags)) return false;
      return tags.includes(String(tagName));
    },

    /**
     * Check if context has any of the specified tags
     * Usage: hasAnyTag("work", "personal")
     */
    hasAnyTag: (...tagNames: unknown[]): boolean => {
      if (!Array.isArray(tags)) return false;
      return tagNames.some(name => tags.includes(String(name)));
    },

    /**
     * Check if context has all of the specified tags
     * Usage: hasAllTags("work", "urgent")
     */
    hasAllTags: (...tagNames: unknown[]): boolean => {
      if (!Array.isArray(tags)) return false;
      return tagNames.every(name => tags.includes(String(name)));
    }
  };
}

/**
 * Create stub functions for validation (don't need actual context)
 */
function createStubFunctions(): Record<string, (...args: unknown[]) => unknown> {
  return {
    hasTag: () => true,
    hasAnyTag: () => true,
    hasAllTags: () => true
  };
}

/**
 * Wrapper for compiled Filtrex expression
 */
class CompiledFilter implements ICompiledFilter {
  constructor(private readonly expression: string) {}

  evaluate(context: Record<string, unknown>): boolean {
    try {
      const contextFunctions = createContextFunctions(context);
      const filterFn = compileExpression(this.expression, {
        extraFunctions: contextFunctions
      });
      const result = filterFn(context);
      return Boolean(result);
    } catch {
      return false;
    }
  }
}

/**
 * Adapter that implements IFilterExpressionEvaluator using Filtrex
 */
export class FiltrexExpressionEvaluator implements IFilterExpressionEvaluator {
  /**
   * Validate an expression without compiling it
   */
  validate(expression: string): ValidationResult {
    if (!expression || expression.trim() === '') {
      return { valid: false, error: 'Expression cannot be empty' };
    }

    try {
      // Use stub functions for validation - we just need to check syntax
      compileExpression(expression, {
        extraFunctions: createStubFunctions()
      });
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : 'Invalid expression'
      };
    }
  }

  /**
   * Compile an expression into a reusable filter
   */
  compile(expression: string): ICompiledFilter {
    if (!expression || expression.trim() === '') {
      throw new Error('Expression cannot be empty');
    }

    // Validate the expression first
    try {
      compileExpression(expression, {
        extraFunctions: createStubFunctions()
      });
    } catch (err) {
      throw new Error(
        `Failed to compile expression: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }

    return new CompiledFilter(expression);
  }

  /**
   * Evaluate an expression directly against a context
   */
  evaluate(expression: string, context: Record<string, unknown>): boolean {
    const filter = this.compile(expression);
    return filter.evaluate(context);
  }
}
