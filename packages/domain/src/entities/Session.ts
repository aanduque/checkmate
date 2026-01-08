/**
 * Session - Focus session for working on a task
 * Entity: Has identity, tracks time spent
 *
 * Lifecycle: in_progress → completed | abandoned
 */

import { SessionStatus, SessionStatusType } from '../value-objects/SessionStatus';
import { FocusLevel, FocusLevelType } from '../value-objects/FocusLevel';

export interface SessionObject {
  id: string;
  taskId: string;
  status: SessionStatusType;
  startedAt: string;
  endedAt: string | null;
  focusLevel: FocusLevelType | null;
  note: string | null;
  isManual: boolean;
}

export class Session {
  private constructor(
    private readonly _id: string,
    private readonly _taskId: string,
    private readonly _status: SessionStatus,
    private readonly _startedAt: Date,
    private readonly _endedAt: Date | null,
    private readonly _focusLevel: FocusLevel | null,
    private readonly _note: string | null,
    private readonly _isManual: boolean
  ) {}

  get id(): string { return this._id; }
  get taskId(): string { return this._taskId; }
  get status(): SessionStatus { return this._status; }
  get startedAt(): Date { return this._startedAt; }
  get endedAt(): Date | null { return this._endedAt; }
  get focusLevel(): FocusLevel | null { return this._focusLevel; }
  get note(): string | null { return this._note; }
  get isManual(): boolean { return this._isManual; }

  /**
   * Get duration in seconds (0 if not ended)
   */
  get durationSeconds(): number {
    if (!this._endedAt) return 0;
    return Math.floor((this._endedAt.getTime() - this._startedAt.getTime()) / 1000);
  }

  /**
   * Start a new session for a task
   */
  static start(taskId: string): Session {
    if (!taskId || !taskId.trim()) {
      throw new Error('Task ID is required');
    }

    return new Session(
      Session.generateId(),
      taskId.trim(),
      SessionStatus.inProgress(),
      new Date(),
      null,
      null,
      null,
      false
    );
  }

  /**
   * Create a manual (backdated) session
   */
  static createManual(props: {
    taskId: string;
    startedAt: Date;
    endedAt: Date;
    focusLevel: FocusLevelType;
    note?: string;
  }): Session {
    if (!props.taskId || !props.taskId.trim()) {
      throw new Error('Task ID is required');
    }

    if (props.endedAt <= props.startedAt) {
      throw new Error('End time must be after start time');
    }

    return new Session(
      Session.generateId(),
      props.taskId.trim(),
      SessionStatus.completed(),
      props.startedAt,
      props.endedAt,
      FocusLevel.create(props.focusLevel),
      props.note?.trim() || null,
      true
    );
  }

  /**
   * Complete the session with a focus level
   */
  complete(focusLevel: FocusLevelType): Session {
    if (!this._status.isInProgress()) {
      throw new Error('Can only complete an in-progress session');
    }

    return new Session(
      this._id,
      this._taskId,
      SessionStatus.completed(),
      this._startedAt,
      new Date(),
      FocusLevel.create(focusLevel),
      this._note,
      this._isManual
    );
  }

  /**
   * Abandon the session
   */
  abandon(): Session {
    if (!this._status.isInProgress()) {
      throw new Error('Can only abandon an in-progress session');
    }

    return new Session(
      this._id,
      this._taskId,
      SessionStatus.abandoned(),
      this._startedAt,
      new Date(),
      null,
      this._note,
      this._isManual
    );
  }

  /**
   * Add a note to the session
   */
  addNote(note: string): Session {
    return new Session(
      this._id,
      this._taskId,
      this._status,
      this._startedAt,
      this._endedAt,
      this._focusLevel,
      note.trim() || null,
      this._isManual
    );
  }

  /**
   * Recreate from a plain object
   */
  static fromObject(obj: SessionObject): Session {
    return new Session(
      obj.id,
      obj.taskId,
      SessionStatus.create(obj.status),
      new Date(obj.startedAt),
      obj.endedAt ? new Date(obj.endedAt) : null,
      obj.focusLevel ? FocusLevel.create(obj.focusLevel) : null,
      obj.note,
      obj.isManual
    );
  }

  /**
   * Serialize to a plain object
   */
  toObject(): SessionObject {
    return {
      id: this._id,
      taskId: this._taskId,
      status: this._status.value,
      startedAt: this._startedAt.toISOString(),
      endedAt: this._endedAt?.toISOString() ?? null,
      focusLevel: this._focusLevel?.value ?? null,
      note: this._note,
      isManual: this._isManual
    };
  }

  private static generateId(): string {
    return `session_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}_${Date.now()}`;
  }
}
