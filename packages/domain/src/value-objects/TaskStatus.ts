/**
 * TaskStatus - Lifecycle status of a task
 * Value Object: Immutable, equality by value
 *
 * Lifecycle: active → completed | canceled (terminal states)
 * Per DEC-013: Once completed or canceled, task cannot transition to any other state
 */

export const TASK_STATUSES = ['active', 'completed', 'canceled'] as const;
export type TaskStatusType = (typeof TASK_STATUSES)[number];

export class TaskStatus {
  private constructor(private readonly _value: TaskStatusType) {}

  get value(): TaskStatusType {
    return this._value;
  }

  /**
   * Create TaskStatus from a string value
   */
  static create(value: TaskStatusType): TaskStatus {
    if (!TASK_STATUSES.includes(value)) {
      throw new Error(
        `Invalid task status: ${value}. Must be one of: ${TASK_STATUSES.join(', ')}`
      );
    }
    return new TaskStatus(value);
  }

  /**
   * Factory for active status
   */
  static active(): TaskStatus {
    return new TaskStatus('active');
  }

  /**
   * Factory for completed status
   */
  static completed(): TaskStatus {
    return new TaskStatus('completed');
  }

  /**
   * Factory for canceled status
   */
  static canceled(): TaskStatus {
    return new TaskStatus('canceled');
  }

  isActive(): boolean {
    return this._value === 'active';
  }

  isCompleted(): boolean {
    return this._value === 'completed';
  }

  isCanceled(): boolean {
    return this._value === 'canceled';
  }

  /**
   * Returns true if task is in a terminal state (completed or canceled)
   */
  isTerminal(): boolean {
    return this._value === 'completed' || this._value === 'canceled';
  }

  /**
   * Check if this status can transition to the target status
   * Per DEC-013: active → completed | canceled, but terminal states cannot transition
   */
  canTransitionTo(target: TaskStatus): boolean {
    // Terminal states cannot transition
    if (this.isTerminal()) {
      return false;
    }
    // Active can only transition to completed or canceled
    return target.isCompleted() || target.isCanceled();
  }

  equals(other: TaskStatus): boolean {
    return this._value === other._value;
  }
}
