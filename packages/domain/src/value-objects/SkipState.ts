/**
 * SkipState - Temporary skip state for a task
 * Value Object: Immutable
 *
 * Per DEC-005 and DEC-006:
 * - for_now: Task goes to bottom of sprint, no justification needed
 * - for_day: Task hidden until returnAt, requires justification comment
 * - When returned from for_day, task appears at TOP of sprint
 */

export type SkipType = 'for_now' | 'for_day';

export interface SkipStateObject {
  type: SkipType;
  skippedAt: string;
  returnAt?: string;
  justificationCommentId?: string;
  returned?: boolean;
}

export class SkipState {
  private constructor(
    private readonly _type: SkipType,
    private readonly _skippedAt: Date,
    private readonly _returnAt?: Date,
    private readonly _justificationCommentId?: string,
    private readonly _returned: boolean = false
  ) {}

  get type(): SkipType {
    return this._type;
  }

  get skippedAt(): Date {
    return this._skippedAt;
  }

  get returnAt(): Date | undefined {
    return this._returnAt;
  }

  get justificationCommentId(): string | undefined {
    return this._justificationCommentId;
  }

  get returned(): boolean {
    return this._returned;
  }

  /**
   * Create a "skip for now" state
   * Task will appear at bottom of sprint
   */
  static forNow(): SkipState {
    return new SkipState('for_now', new Date());
  }

  /**
   * Create a "skip for day" state
   * Task will be hidden until start of next day
   * Requires a justification comment ID
   */
  static forDay(justificationCommentId: string): SkipState {
    if (!justificationCommentId || !justificationCommentId.trim()) {
      throw new Error('Justification comment ID is required for skip for day');
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);

    return new SkipState(
      'for_day',
      now,
      tomorrow,
      justificationCommentId.trim(),
      false
    );
  }

  /**
   * Recreate from a plain object (for deserialization)
   */
  static fromObject(obj: SkipStateObject): SkipState {
    return new SkipState(
      obj.type,
      new Date(obj.skippedAt),
      obj.returnAt ? new Date(obj.returnAt) : undefined,
      obj.justificationCommentId,
      obj.returned ?? false
    );
  }

  /**
   * Check if this is a "for now" skip
   */
  isForNow(): boolean {
    return this._type === 'for_now';
  }

  /**
   * Check if this is a "for day" skip
   */
  isForDay(): boolean {
    return this._type === 'for_day';
  }

  /**
   * Check if the task should return (for for_day only)
   * Returns true if current time >= returnAt
   */
  shouldReturn(currentTime: Date): boolean {
    if (this._type !== 'for_day' || !this._returnAt) {
      return false;
    }
    return currentTime >= this._returnAt;
  }

  /**
   * Create a new SkipState with the returned flag set
   */
  markReturned(): SkipState {
    return new SkipState(
      this._type,
      this._skippedAt,
      this._returnAt,
      this._justificationCommentId,
      true
    );
  }

  /**
   * Convert to a plain object (for serialization)
   */
  toObject(): SkipStateObject {
    const obj: SkipStateObject = {
      type: this._type,
      skippedAt: this._skippedAt.toISOString()
    };

    if (this._returnAt) {
      obj.returnAt = this._returnAt.toISOString();
    }
    if (this._justificationCommentId) {
      obj.justificationCommentId = this._justificationCommentId;
    }
    if (this._returned) {
      obj.returned = this._returned;
    }

    return obj;
  }
}
