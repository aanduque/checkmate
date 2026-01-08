/**
 * Strongly-typed identifier for Sprints
 */
export class SprintId {
  private readonly _brand: 'SprintId' = 'SprintId';

  private constructor(private readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('SprintId cannot be empty');
    }
  }

  static create(): SprintId {
    return new SprintId(crypto.randomUUID());
  }

  static fromString(value: string): SprintId {
    return new SprintId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: SprintId): boolean {
    return this.value === other.value;
  }
}
