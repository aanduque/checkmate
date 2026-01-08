/**
 * Task - Core entity representing work to be done
 * Entity: Has identity, complex state machine
 *
 * Lifecycle: active → completed | canceled (terminal states)
 */

import { TaskStatus, TaskStatusType } from '../value-objects/TaskStatus';
import { TagPoints } from '../value-objects/TagPoints';
import { TaskLocation, TaskLocationObject } from '../value-objects/TaskLocation';
import { SkipState, SkipStateObject } from '../value-objects/SkipState';
import { Comment, CommentObject } from './Comment';
import { Session, SessionObject } from './Session';

export interface TaskObject {
  id: string;
  title: string;
  description: string;
  status: TaskStatusType;
  tagPoints: Record<string, number>;
  location: TaskLocationObject;
  createdAt: string;
  completedAt: string | null;
  canceledAt: string | null;
  skipState: SkipStateObject | null;
  recurrence: string | null;
  parentId: string | null;
  sprintHistory: string[];
  comments: CommentObject[];
  sessions: SessionObject[];
}

export class Task {
  private constructor(
    private readonly _id: string,
    private readonly _title: string,
    private readonly _description: string,
    private readonly _status: TaskStatus,
    private readonly _tagPoints: TagPoints,
    private readonly _location: TaskLocation,
    private readonly _createdAt: Date,
    private readonly _completedAt: Date | null,
    private readonly _canceledAt: Date | null,
    private readonly _skipState: SkipState | null,
    private readonly _recurrence: string | null,
    private readonly _parentId: string | null,
    private readonly _sprintHistory: string[],
    private readonly _comments: Comment[],
    private readonly _sessions: Session[]
  ) {}

  // Getters
  get id(): string { return this._id; }
  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get status(): TaskStatus { return this._status; }
  get tagPoints(): TagPoints { return this._tagPoints; }
  get location(): TaskLocation { return this._location; }
  get createdAt(): Date { return this._createdAt; }
  get completedAt(): Date | null { return this._completedAt; }
  get canceledAt(): Date | null { return this._canceledAt; }
  get skipState(): SkipState | null { return this._skipState; }
  get recurrence(): string | null { return this._recurrence; }
  get parentId(): string | null { return this._parentId; }
  get sprintHistory(): string[] { return [...this._sprintHistory]; }
  get comments(): Comment[] { return [...this._comments]; }
  get sessions(): Session[] { return [...this._sessions]; }

  get totalPoints(): number {
    return this._tagPoints.totalPoints();
  }

  /**
   * Create a new task
   */
  static create(props: {
    title: string;
    description?: string;
    tagPoints: Record<string, number>;
    recurrence?: string;
  }): Task {
    const trimmedTitle = props.title.trim();
    if (!trimmedTitle) {
      throw new Error('Task title cannot be empty');
    }

    return new Task(
      Task.generateId(),
      trimmedTitle,
      props.description?.trim() ?? '',
      TaskStatus.active(),
      TagPoints.create(props.tagPoints),
      TaskLocation.backlog(),
      new Date(),
      null,
      null,
      null,
      props.recurrence ?? null,
      null,
      [],
      [],
      []
    );
  }

  /**
   * Check if this task is a recurring template
   */
  isRecurringTemplate(): boolean {
    return this._recurrence !== null;
  }

  /**
   * Spawn a task instance from a recurring template
   */
  spawnInstance(): Task {
    if (!this.isRecurringTemplate()) {
      throw new Error('Can only spawn instances from recurring templates');
    }

    return new Task(
      Task.generateId(),
      this._title,
      this._description,
      TaskStatus.active(),
      TagPoints.create(this._tagPoints.toRecord()),
      TaskLocation.backlog(),
      new Date(),
      null,
      null,
      null,
      null, // Instance is not recurring
      this._id, // Parent ID is template ID
      [],
      [],
      []
    );
  }

  /**
   * Get task age in days
   */
  getAge(now: Date = new Date()): number {
    const diff = now.getTime() - this._createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // === Status Transitions ===

  /**
   * Complete the task
   */
  complete(): Task {
    if (!this._status.isActive()) {
      throw new Error('Cannot complete a task that is not active');
    }

    return new Task(
      this._id,
      this._title,
      this._description,
      TaskStatus.completed(),
      this._tagPoints,
      this._location,
      this._createdAt,
      new Date(),
      null,
      null, // Clear skip state
      this._recurrence,
      this._parentId,
      this._sprintHistory,
      this._comments,
      this._sessions
    );
  }

  /**
   * Cancel the task with a required justification
   */
  cancel(justification: string): { task: Task; comment: Comment } {
    if (!this._status.isActive()) {
      throw new Error('Cannot cancel a task that is not active');
    }

    const trimmed = justification.trim();
    if (!trimmed) {
      throw new Error('Cancellation justification is required');
    }

    const comment = Comment.createCancelJustification(trimmed);

    const task = new Task(
      this._id,
      this._title,
      this._description,
      TaskStatus.canceled(),
      this._tagPoints,
      this._location,
      this._createdAt,
      null,
      new Date(),
      null, // Clear skip state
      this._recurrence,
      this._parentId,
      this._sprintHistory,
      [...this._comments, comment],
      this._sessions
    );

    return { task, comment };
  }

  // === Field Updates ===

  private ensureActive(): void {
    if (!this._status.isActive()) {
      throw new Error('Cannot modify a completed or canceled task');
    }
  }

  updateTitle(title: string): Task {
    this.ensureActive();
    const trimmed = title.trim();
    if (!trimmed) {
      throw new Error('Task title cannot be empty');
    }

    return this.withUpdates({ title: trimmed });
  }

  updateDescription(description: string): Task {
    this.ensureActive();
    return this.withUpdates({ description: description.trim() });
  }

  // === Location ===

  moveToBacklog(): Task {
    const newHistory = this._location.isSprint() && this._location.sprintId
      ? [...this._sprintHistory, this._location.sprintId]
      : this._sprintHistory;

    return new Task(
      this._id,
      this._title,
      this._description,
      this._status,
      this._tagPoints,
      TaskLocation.backlog(),
      this._createdAt,
      this._completedAt,
      this._canceledAt,
      null, // Clear skip state
      this._recurrence,
      this._parentId,
      newHistory,
      this._comments,
      this._sessions
    );
  }

  moveToSprint(sprintId: string): Task {
    return new Task(
      this._id,
      this._title,
      this._description,
      this._status,
      this._tagPoints,
      TaskLocation.sprint(sprintId),
      this._createdAt,
      this._completedAt,
      this._canceledAt,
      null, // Clear skip state
      this._recurrence,
      this._parentId,
      this._sprintHistory,
      this._comments,
      this._sessions
    );
  }

  // === Skip State ===

  skipForNow(): Task {
    if (!this._status.isActive()) {
      throw new Error('Cannot skip a completed or canceled task');
    }

    return this.withUpdates({ skipState: SkipState.forNow() });
  }

  skipForDay(justification: string): { task: Task; comment: Comment } {
    if (!this._status.isActive()) {
      throw new Error('Cannot skip a completed or canceled task');
    }

    const trimmed = justification.trim();
    if (!trimmed) {
      throw new Error('Justification is required for skip for day');
    }

    const comment = Comment.createSkipJustification(trimmed);
    const skipState = SkipState.forDay(comment.id);

    const task = new Task(
      this._id,
      this._title,
      this._description,
      this._status,
      this._tagPoints,
      this._location,
      this._createdAt,
      this._completedAt,
      this._canceledAt,
      skipState,
      this._recurrence,
      this._parentId,
      this._sprintHistory,
      [...this._comments, comment],
      this._sessions
    );

    return { task, comment };
  }

  clearSkipState(): Task {
    return this.withUpdates({ skipState: null });
  }

  // === Tag Management ===

  addTag(tagId: string, points: number): Task {
    this.ensureActive();
    return this.withUpdates({
      tagPoints: this._tagPoints.withTag(tagId, points)
    });
  }

  removeTag(tagId: string): Task {
    this.ensureActive();
    return this.withUpdates({
      tagPoints: this._tagPoints.withoutTag(tagId)
    });
  }

  updateTagPoints(tagId: string, points: number): Task {
    this.ensureActive();
    return this.withUpdates({
      tagPoints: this._tagPoints.withTag(tagId, points)
    });
  }

  // === Comments ===

  addComment(content: string): { task: Task; comment: Comment } {
    const comment = Comment.create({ content });
    const task = this.withUpdates({
      comments: [...this._comments, comment]
    });
    return { task, comment };
  }

  // === Sessions ===

  addSession(session: Session): Task {
    return this.withUpdates({
      sessions: [...this._sessions, session]
    });
  }

  updateSession(sessionId: string, updatedSession: Session): Task {
    const sessions = this._sessions.map(s =>
      s.id === sessionId ? updatedSession : s
    );
    return this.withUpdates({ sessions });
  }

  // === Serialization ===

  static fromObject(obj: TaskObject): Task {
    return new Task(
      obj.id,
      obj.title,
      obj.description,
      TaskStatus.create(obj.status),
      TagPoints.create(obj.tagPoints),
      TaskLocation.fromObject(obj.location),
      new Date(obj.createdAt),
      obj.completedAt ? new Date(obj.completedAt) : null,
      obj.canceledAt ? new Date(obj.canceledAt) : null,
      obj.skipState ? SkipState.fromObject(obj.skipState) : null,
      obj.recurrence,
      obj.parentId,
      obj.sprintHistory,
      obj.comments.map(c => Comment.fromObject(c)),
      obj.sessions.map(s => Session.fromObject(s))
    );
  }

  toObject(): TaskObject {
    return {
      id: this._id,
      title: this._title,
      description: this._description,
      status: this._status.value,
      tagPoints: this._tagPoints.toRecord(),
      location: this._location.toObject(),
      createdAt: this._createdAt.toISOString(),
      completedAt: this._completedAt?.toISOString() ?? null,
      canceledAt: this._canceledAt?.toISOString() ?? null,
      skipState: this._skipState?.toObject() ?? null,
      recurrence: this._recurrence,
      parentId: this._parentId,
      sprintHistory: this._sprintHistory,
      comments: this._comments.map(c => c.toObject()),
      sessions: this._sessions.map(s => s.toObject())
    };
  }

  // === Private Helpers ===

  private withUpdates(updates: Partial<{
    title: string;
    description: string;
    tagPoints: TagPoints;
    skipState: SkipState | null;
    comments: Comment[];
    sessions: Session[];
  }>): Task {
    return new Task(
      this._id,
      updates.title ?? this._title,
      updates.description ?? this._description,
      this._status,
      updates.tagPoints ?? this._tagPoints,
      this._location,
      this._createdAt,
      this._completedAt,
      this._canceledAt,
      updates.skipState !== undefined ? updates.skipState : this._skipState,
      this._recurrence,
      this._parentId,
      this._sprintHistory,
      updates.comments ?? this._comments,
      updates.sessions ?? this._sessions
    );
  }

  private static generateId(): string {
    return `task_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}_${Date.now()}`;
  }
}
