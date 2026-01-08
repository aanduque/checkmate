/**
 * IFilterExpressionEvaluator - Port interface for expression evaluation
 *
 * Per DEC-007 (Filtrex) and DEC-024 (Hexagonal Architecture):
 * - Domain defines this interface
 * - Infrastructure implements via Filtrex library
 * - Domain remains pure with zero external dependencies
 */

/**
 * Result of validating a filter expression
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * A compiled filter that can be evaluated against contexts
 */
export interface ICompiledFilter {
  /**
   * Evaluate the filter against a context object
   * Returns true if the context matches the filter expression
   */
  evaluate(context: Record<string, unknown>): boolean;
}

/**
 * Port interface for evaluating filter expressions
 * Used by Routines for both activation expressions and task filter expressions
 */
export interface IFilterExpressionEvaluator {
  /**
   * Compile an expression string into a reusable filter
   * Throws if the expression is invalid
   */
  compile(expression: string): ICompiledFilter;

  /**
   * Validate an expression without compiling it
   * Returns validation result indicating if expression is valid
   */
  validate(expression: string): ValidationResult;

  /**
   * Evaluate an expression directly against a context
   * Convenience method that compiles and evaluates in one step
   */
  evaluate(expression: string, context: Record<string, unknown>): boolean;
}
