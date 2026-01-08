/**
 * SessionStatus - Status of a focus session
 * Value Object: Immutable, equality by value
 *
 * Lifecycle: in_progress → completed | abandoned
 */

export const SESSION_STATUSES = ['in_progress', 'completed', 'abandoned'] as const;
export type SessionStatusType = (typeof SESSION_STATUSES)[number];

export class SessionStatus {
  private constructor(private readonly _value: SessionStatusType) {}

  get value(): SessionStatusType {
    return this._value;
  }

  /**
   * Create SessionStatus from a string value
   */
  static create(value: SessionStatusType): SessionStatus {
    if (!SESSION_STATUSES.includes(value)) {
      throw new Error(
        `Invalid session status: ${value}. Must be one of: ${SESSION_STATUSES.join(', ')}`
      );
    }
    return new SessionStatus(value);
  }

  /**
   * Factory for in_progress status
   */
  static inProgress(): SessionStatus {
    return new SessionStatus('in_progress');
  }

  /**
   * Factory for completed status
   */
  static completed(): SessionStatus {
    return new SessionStatus('completed');
  }

  /**
   * Factory for abandoned status
   */
  static abandoned(): SessionStatus {
    return new SessionStatus('abandoned');
  }

  isInProgress(): boolean {
    return this._value === 'in_progress';
  }

  isCompleted(): boolean {
    return this._value === 'completed';
  }

  isAbandoned(): boolean {
    return this._value === 'abandoned';
  }

  /**
   * Returns true if session is in a terminal state (completed or abandoned)
   */
  isTerminal(): boolean {
    return this._value === 'completed' || this._value === 'abandoned';
  }

  equals(other: SessionStatus): boolean {
    return this._value === other._value;
  }
}
