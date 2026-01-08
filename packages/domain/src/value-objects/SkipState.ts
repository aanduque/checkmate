import { CommentId } from './CommentId';

/**
 * SkipState value object - represents temporary task deprioritization
 */
export type SkipType = 'for_now' | 'for_day';

export interface SkipStateData {
  type: SkipType;
  skippedAt: Date;
  returnAt?: Date;
  justificationCommentId?: string;
  returned?: boolean;
}

export class SkipState {
  private readonly _brand: 'SkipState' = 'SkipState';

  private constructor(
    private readonly type: SkipType,
    private readonly skippedAt: Date,
    private readonly returnAt?: Date,
    private readonly justificationCommentId?: CommentId,
    private _returned: boolean = false
  ) {}

  static forNow(): SkipState {
    return new SkipState('for_now', new Date());
  }

  static forDay(justificationCommentId: CommentId): SkipState {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return new SkipState('for_day', new Date(), tomorrow, justificationCommentId);
  }

  static fromData(data: SkipStateData): SkipState {
    return new SkipState(
      data.type,
      new Date(data.skippedAt),
      data.returnAt ? new Date(data.returnAt) : undefined,
      data.justificationCommentId
        ? CommentId.fromString(data.justificationCommentId)
        : undefined,
      data.returned ?? false
    );
  }

  getType(): SkipType {
    return this.type;
  }

  getSkippedAt(): Date {
    return this.skippedAt;
  }

  getReturnAt(): Date | undefined {
    return this.returnAt;
  }

  getJustificationCommentId(): CommentId | undefined {
    return this.justificationCommentId;
  }

  isReturned(): boolean {
    return this._returned;
  }

  isForNow(): boolean {
    return this.type === 'for_now';
  }

  isForDay(): boolean {
    return this.type === 'for_day';
  }

  shouldReturn(now: Date): boolean {
    if (this.type !== 'for_day' || !this.returnAt) return false;
    return now >= this.returnAt && !this._returned;
  }

  markReturned(): SkipState {
    return new SkipState(
      this.type,
      this.skippedAt,
      this.returnAt,
      this.justificationCommentId,
      true
    );
  }

  toData(): SkipStateData {
    return {
      type: this.type,
      skippedAt: this.skippedAt,
      returnAt: this.returnAt,
      justificationCommentId: this.justificationCommentId?.toString(),
      returned: this._returned,
    };
  }
}
