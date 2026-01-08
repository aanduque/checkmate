/**
 * Points - Fibonacci-constrained effort estimation
 * Value Object: Immutable, equality by value
 *
 * Business Rule: Points must be from the Fibonacci sequence [1, 2, 3, 5, 8, 13, 21]
 * where 1 point ≈ 1 hour of effort
 */

export const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;
export type FibonacciPoint = (typeof FIBONACCI_POINTS)[number];

export class Points {
  private constructor(private readonly _value: FibonacciPoint) {}

  get value(): FibonacciPoint {
    return this._value;
  }

  /**
   * Create Points from a number, validating it's a Fibonacci value
   */
  static create(value: number): Points {
    if (!Points.isValid(value)) {
      throw new Error(
        `Points must be a valid Fibonacci number: ${FIBONACCI_POINTS.join(', ')}. Got: ${value}`
      );
    }
    return new Points(value as FibonacciPoint);
  }

  /**
   * Check if a number is a valid Fibonacci point value
   */
  static isValid(value: number): value is FibonacciPoint {
    return FIBONACCI_POINTS.includes(value as FibonacciPoint);
  }

  /**
   * Check equality with another Points
   */
  equals(other: Points): boolean {
    return this._value === other._value;
  }

  /**
   * Get the numeric value
   */
  toNumber(): number {
    return this._value;
  }
}
