/**
 * Base interface for domain events
 */
export interface DomainEvent {
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}

export interface TaskCreated extends DomainEvent {
  eventType: 'TaskCreated';
  title: string;
  tagPoints: Record<string, number>;
}

export interface TaskCompleted extends DomainEvent {
  eventType: 'TaskCompleted';
  taskId: string;
}

export interface TaskCanceled extends DomainEvent {
  eventType: 'TaskCanceled';
  taskId: string;
}

export interface SessionStarted extends DomainEvent {
  eventType: 'SessionStarted';
  taskId: string;
  sessionId: string;
}

export interface SessionCompleted extends DomainEvent {
  eventType: 'SessionCompleted';
  taskId: string;
  sessionId: string;
  focusLevel: string;
  durationSeconds: number;
}

export interface SessionAbandoned extends DomainEvent {
  eventType: 'SessionAbandoned';
  taskId: string;
  sessionId: string;
}

export interface TaskMovedToSprint extends DomainEvent {
  eventType: 'TaskMovedToSprint';
  taskId: string;
  sprintId: string;
}

export interface TaskMovedToBacklog extends DomainEvent {
  eventType: 'TaskMovedToBacklog';
  taskId: string;
  previousSprintId?: string;
}

export interface TaskSkipped extends DomainEvent {
  eventType: 'TaskSkipped';
  taskId: string;
  skipType: 'for_now' | 'for_day';
  justification?: string;
}

export type CheckMateEvent =
  | TaskCreated
  | TaskCompleted
  | TaskCanceled
  | SessionStarted
  | SessionCompleted
  | SessionAbandoned
  | TaskMovedToSprint
  | TaskMovedToBacklog
  | TaskSkipped;
