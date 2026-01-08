import { SessionId } from '../value-objects/SessionId';
import { FocusLevel } from '../value-objects/FocusLevel';
import { Comment } from './Comment';

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export interface SessionProps {
  id: SessionId;
  status: SessionStatus;
  startedAt: Date;
  endedAt?: Date;
  focusLevel?: FocusLevel;
  comments: Comment[];
}

/**
 * Session entity - Pomodoro-style work period, owned by Task aggregate
 */
export class Session {
  private constructor(
    private readonly _id: SessionId,
    private _status: SessionStatus,
    private readonly _startedAt: Date,
    private _endedAt: Date | undefined,
    private _focusLevel: FocusLevel | undefined,
    private readonly _comments: Comment[]
  ) {}

  static start(): Session {
    return new Session(
      SessionId.create(),
      'in_progress',
      new Date(),
      undefined,
      undefined,
      []
    );
  }

  static createManual(params: {
    duration: number; // minutes
    date: Date;
    focusLevel: FocusLevel;
    note?: string;
  }): Session {
    if (params.duration < 1 || params.duration > 480) {
      throw new Error('Duration must be between 1 and 480 minutes');
    }

    const startedAt = new Date(params.date);
    const endedAt = new Date(startedAt.getTime() + params.duration * 60 * 1000);
    const comments: Comment[] = [];

    if (params.note && params.note.trim()) {
      comments.push(
        Comment.create({ content: params.note, skipJustification: false })
      );
    }

    return new Session(
      SessionId.create(),
      'completed',
      startedAt,
      endedAt,
      params.focusLevel,
      comments
    );
  }

  static fromProps(props: SessionProps): Session {
    return new Session(
      props.id,
      props.status,
      props.startedAt,
      props.endedAt,
      props.focusLevel,
      props.comments
    );
  }

  get id(): SessionId {
    return this._id;
  }

  get status(): SessionStatus {
    return this._status;
  }

  get startedAt(): Date {
    return this._startedAt;
  }

  get endedAt(): Date | undefined {
    return this._endedAt;
  }

  get focusLevel(): FocusLevel | undefined {
    return this._focusLevel;
  }

  get comments(): readonly Comment[] {
    return this._comments;
  }

  isInProgress(): boolean {
    return this._status === 'in_progress';
  }

  isCompleted(): boolean {
    return this._status === 'completed';
  }

  isAbandoned(): boolean {
    return this._status === 'abandoned';
  }

  getDuration(): number | undefined {
    if (!this._endedAt) return undefined;
    return Math.floor(
      (this._endedAt.getTime() - this._startedAt.getTime()) / 1000
    );
  }

  getDurationMinutes(): number | undefined {
    const seconds = this.getDuration();
    if (seconds === undefined) return undefined;
    return Math.floor(seconds / 60);
  }

  complete(focusLevel: FocusLevel, note?: string): void {
    if (this._status !== 'in_progress') {
      throw new Error('Can only complete an in-progress session');
    }
    this._status = 'completed';
    this._endedAt = new Date();
    this._focusLevel = focusLevel;

    if (note && note.trim()) {
      this._comments.push(
        Comment.create({ content: note, skipJustification: false })
      );
    }
  }

  abandon(): void {
    if (this._status !== 'in_progress') {
      throw new Error('Can only abandon an in-progress session');
    }
    this._status = 'abandoned';
    this._endedAt = new Date();
  }

  addComment(content: string): Comment {
    const comment = Comment.create({ content, skipJustification: false });
    this._comments.push(comment);
    return comment;
  }

  toData(): {
    id: string;
    status: SessionStatus;
    startedAt: string;
    endedAt: string | null;
    focusLevel: string | null;
    comments: ReturnType<Comment['toData']>[];
  } {
    return {
      id: this._id.toString(),
      status: this._status,
      startedAt: this._startedAt.toISOString(),
      endedAt: this._endedAt?.toISOString() ?? null,
      focusLevel: this._focusLevel?.toString() ?? null,
      comments: this._comments.map((c) => c.toData()),
    };
  }
}
