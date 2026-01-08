import { TaskId } from '../value-objects/TaskId';
import { TagPoints } from '../value-objects/TagPoints';
import { Location } from '../value-objects/Location';
import { SkipState } from '../value-objects/SkipState';
import { Recurrence } from '../value-objects/Recurrence';
import { FocusLevel } from '../value-objects/FocusLevel';
import { CommentId } from '../value-objects/CommentId';
import { Comment } from './Comment';
import { Session } from './Session';

export type TaskStatus = 'active' | 'completed' | 'canceled';

export interface TaskProps {
  id: TaskId;
  title: string;
  description?: string;
  status: TaskStatus;
  tagPoints: TagPoints;
  location: Location;
  createdAt: Date;
  completedAt?: Date;
  canceledAt?: Date;
  skipState?: SkipState;
  recurrence?: Recurrence;
  parentId?: TaskId;
  comments: Comment[];
  sessions: Session[];
  sprintHistory: string[];
  order: number;
}

export interface CreateTaskProps {
  title: string;
  description?: string;
  tagPoints: Record<string, number>;
  recurrence?: string;
  parentId?: TaskId;
}

/**
 * Task aggregate root - core work unit
 * Owns comments, sessions, and skip state
 */
export class Task {
  private constructor(
    private readonly _id: TaskId,
    private _title: string,
    private _description: string,
    private _status: TaskStatus,
    private _tagPoints: TagPoints,
    private _location: Location,
    private readonly _createdAt: Date,
    private _completedAt: Date | undefined,
    private _canceledAt: Date | undefined,
    private _skipState: SkipState | undefined,
    private readonly _recurrence: Recurrence | undefined,
    private readonly _parentId: TaskId | undefined,
    private readonly _comments: Comment[],
    private readonly _sessions: Session[],
    private readonly _sprintHistory: string[],
    private _order: number
  ) {}

  static create(props: CreateTaskProps): Task {
    if (!props.title || props.title.trim() === '') {
      throw new Error('Task title cannot be empty');
    }

    const tagPoints = TagPoints.create(props.tagPoints);

    return new Task(
      TaskId.create(),
      props.title.trim(),
      props.description?.trim() ?? '',
      'active',
      tagPoints,
      Location.backlog(),
      new Date(),
      undefined,
      undefined,
      undefined,
      props.recurrence ? Recurrence.create(props.recurrence) : undefined,
      props.parentId,
      [],
      [],
      [],
      0
    );
  }

  static fromProps(props: TaskProps): Task {
    return new Task(
      props.id,
      props.title,
      props.description ?? '',
      props.status,
      props.tagPoints,
      props.location,
      props.createdAt,
      props.completedAt,
      props.canceledAt,
      props.skipState,
      props.recurrence,
      props.parentId,
      props.comments,
      props.sessions,
      props.sprintHistory,
      props.order
    );
  }

  // Getters
  get id(): TaskId {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get status(): TaskStatus {
    return this._status;
  }

  get tagPoints(): TagPoints {
    return this._tagPoints;
  }

  get location(): Location {
    return this._location;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  get canceledAt(): Date | undefined {
    return this._canceledAt;
  }

  get skipState(): SkipState | undefined {
    return this._skipState;
  }

  get recurrence(): Recurrence | undefined {
    return this._recurrence;
  }

  get parentId(): TaskId | undefined {
    return this._parentId;
  }

  get comments(): readonly Comment[] {
    return this._comments;
  }

  get sessions(): readonly Session[] {
    return this._sessions;
  }

  get sprintHistory(): readonly string[] {
    return this._sprintHistory;
  }

  get order(): number {
    return this._order;
  }

  // Status checks
  isActive(): boolean {
    return this._status === 'active';
  }

  isCompleted(): boolean {
    return this._status === 'completed';
  }

  isCanceled(): boolean {
    return this._status === 'canceled';
  }

  isRecurringTemplate(): boolean {
    return this._recurrence !== undefined;
  }

  isRecurringInstance(): boolean {
    return this._parentId !== undefined && !this._recurrence;
  }

  getAge(now: Date = new Date()): number {
    return Math.floor(
      (now.getTime() - this._createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Mutations (only on active tasks)
  private ensureActive(): void {
    if (!this.isActive()) {
      throw new Error('Cannot modify a completed or canceled task');
    }
  }

  updateTitle(title: string): void {
    this.ensureActive();
    if (!title || title.trim() === '') {
      throw new Error('Task title cannot be empty');
    }
    this._title = title.trim();
  }

  updateDescription(description: string): void {
    this.ensureActive();
    this._description = description?.trim() ?? '';
  }

  updateTagPoints(tagPoints: Record<string, number>): void {
    this.ensureActive();
    this._tagPoints = TagPoints.create(tagPoints);
  }

  complete(): void {
    this.ensureActive();
    this._status = 'completed';
    this._completedAt = new Date();
    this._skipState = undefined;
  }

  cancel(): void {
    this.ensureActive();
    this._status = 'canceled';
    this._canceledAt = new Date();
    this._skipState = undefined;
  }

  // Location management
  moveToSprint(sprintId: import('../value-objects/SprintId').SprintId): void {
    this.ensureActive();
    if (this.isRecurringTemplate()) {
      throw new Error('Recurring templates cannot be moved to a sprint');
    }
    this._location = Location.sprint(sprintId);
    this._skipState = undefined;
  }

  moveToBacklog(): void {
    this.ensureActive();
    if (this._location.isSprint()) {
      const sprintId = this._location.getSprintId();
      if (sprintId) {
        this._sprintHistory.push(sprintId.toString());
      }
    }
    this._location = Location.backlog();
    this._skipState = undefined;
  }

  setOrder(order: number): void {
    this._order = order;
  }

  // Skip state management
  skipForNow(): void {
    this.ensureActive();
    this._skipState = SkipState.forNow();
  }

  skipForDay(justification: string): CommentId {
    this.ensureActive();
    if (!justification || justification.trim() === '') {
      throw new Error('Skip justification is required');
    }

    const comment = Comment.create({
      content: justification,
      skipJustification: true,
    });
    this._comments.push(comment);
    this._skipState = SkipState.forDay(comment.id);
    return comment.id;
  }

  clearSkipState(): void {
    this._skipState = undefined;
  }

  checkAndMarkSkipReturn(now: Date): boolean {
    if (this._skipState?.shouldReturn(now)) {
      this._skipState = this._skipState.markReturned();
      return true;
    }
    return false;
  }

  // Comments
  addComment(content: string): Comment {
    const comment = Comment.create({ content, skipJustification: false });
    this._comments.push(comment);
    return comment;
  }

  updateComment(commentId: CommentId, content: string): void {
    const comment = this._comments.find((c) => c.id.equals(commentId));
    if (!comment) {
      throw new Error('Comment not found');
    }
    comment.updateContent(content);
  }

  deleteComment(commentId: CommentId): void {
    const index = this._comments.findIndex((c) => c.id.equals(commentId));
    if (index === -1) {
      throw new Error('Comment not found');
    }
    this._comments.splice(index, 1);
  }

  // Sessions
  startSession(): Session {
    this.ensureActive();
    const activeSession = this._sessions.find((s) => s.isInProgress());
    if (activeSession) {
      throw new Error('A session is already in progress');
    }
    const session = Session.start();
    this._sessions.push(session);
    return session;
  }

  getActiveSession(): Session | undefined {
    return this._sessions.find((s) => s.isInProgress());
  }

  completeSession(
    sessionId: import('../value-objects/SessionId').SessionId,
    focusLevel: FocusLevel,
    note?: string
  ): void {
    const session = this._sessions.find((s) => s.id.equals(sessionId));
    if (!session) {
      throw new Error('Session not found');
    }
    session.complete(focusLevel, note);
  }

  abandonSession(
    sessionId: import('../value-objects/SessionId').SessionId
  ): void {
    const session = this._sessions.find((s) => s.id.equals(sessionId));
    if (!session) {
      throw new Error('Session not found');
    }
    session.abandon();
  }

  // Spawn instance from recurring template
  spawnInstance(): Task {
    if (!this.isRecurringTemplate()) {
      throw new Error('Can only spawn instances from recurring templates');
    }

    return new Task(
      TaskId.create(),
      this._title,
      this._description,
      'active',
      this._tagPoints,
      Location.backlog(),
      new Date(),
      undefined,
      undefined,
      undefined,
      undefined,
      this._id,
      [],
      [],
      [],
      0
    );
  }

  // Serialization
  toData(): {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    tagPoints: Record<string, number>;
    location: { type: string; sprintId?: string };
    createdAt: string;
    completedAt: string | null;
    canceledAt: string | null;
    skipState: ReturnType<SkipState['toData']> | null;
    recurrence: string | null;
    parentId: string | null;
    comments: ReturnType<Comment['toData']>[];
    sessions: ReturnType<Session['toData']>[];
    sprintHistory: string[];
    order: number;
  } {
    return {
      id: this._id.toString(),
      title: this._title,
      description: this._description,
      status: this._status,
      tagPoints: this._tagPoints.toRecord(),
      location: this._location.toData(),
      createdAt: this._createdAt.toISOString(),
      completedAt: this._completedAt?.toISOString() ?? null,
      canceledAt: this._canceledAt?.toISOString() ?? null,
      skipState: this._skipState?.toData() ?? null,
      recurrence: this._recurrence?.toString() ?? null,
      parentId: this._parentId?.toString() ?? null,
      comments: this._comments.map((c) => c.toData()),
      sessions: this._sessions.map((s) => s.toData()),
      sprintHistory: [...this._sprintHistory],
      order: this._order,
    };
  }
}
