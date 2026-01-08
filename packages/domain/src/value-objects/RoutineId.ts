/**
 * Strongly-typed identifier for Routines
 */
export class RoutineId {
  private readonly _brand: 'RoutineId' = 'RoutineId';

  private constructor(private readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('RoutineId cannot be empty');
    }
  }

  static create(): RoutineId {
    return new RoutineId(crypto.randomUUID());
  }

  static fromString(value: string): RoutineId {
    return new RoutineId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: RoutineId): boolean {
    return this.value === other.value;
  }
}
