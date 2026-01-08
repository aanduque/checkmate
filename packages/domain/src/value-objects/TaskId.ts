/**
 * Strongly-typed identifier for Tasks
 * Prevents accidental mixing of ID types
 */
export class TaskId {
  private readonly _brand: 'TaskId' = 'TaskId';

  private constructor(private readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('TaskId cannot be empty');
    }
  }

  static create(): TaskId {
    return new TaskId(crypto.randomUUID());
  }

  static fromString(value: string): TaskId {
    return new TaskId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: TaskId): boolean {
    return this.value === other.value;
  }
}
