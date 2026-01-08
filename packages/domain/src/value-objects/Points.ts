/**
 * Points value object - constrained to Fibonacci sequence
 * 1 point ≈ 1 hour of effort
 */
const VALID_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;
export type PointsValue = (typeof VALID_POINTS)[number];

export class Points {
  private readonly _brand: 'Points' = 'Points';

  private constructor(private readonly value: PointsValue) {}

  static create(value: number): Points {
    if (!VALID_POINTS.includes(value as PointsValue)) {
      throw new Error(
        `Invalid points value: ${value}. Must be one of: ${VALID_POINTS.join(', ')}`
      );
    }
    return new Points(value as PointsValue);
  }

  static validValues(): readonly number[] {
    return VALID_POINTS;
  }

  toNumber(): number {
    return this.value;
  }

  equals(other: Points): boolean {
    return this.value === other.value;
  }
}
