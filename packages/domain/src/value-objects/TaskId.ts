/**
 * TaskId - Unique identifier for tasks
 * Value Object: Immutable, equality by value
 */
export class TaskId {
  private constructor(private readonly _value: string) {}

  get value(): string {
    return this._value;
  }

  /**
   * Create a new TaskId with a generated UUID
   */
  static create(): TaskId {
    const id = `task_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}_${Date.now()}`;
    return new TaskId(id);
  }

  /**
   * Create a TaskId from an existing string value
   */
  static fromString(value: string): TaskId {
    if (!value || !value.trim()) {
      throw new Error('TaskId cannot be empty');
    }
    return new TaskId(value.trim());
  }

  /**
   * Check equality with another TaskId
   */
  equals(other: TaskId): boolean {
    return this._value === other._value;
  }

  /**
   * Return the string representation
   */
  toString(): string {
    return this._value;
  }
}
