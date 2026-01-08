/**
 * Domain Events - Events that occur within the domain
 *
 * These can be used for:
 * - Cross-aggregate communication
 * - Triggering side effects
 * - Event sourcing (if needed later)
 */

export interface DomainEvent {
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}

// Task Events
export class TaskCreatedEvent implements DomainEvent {
  readonly eventType = 'TaskCreated';
  readonly occurredAt = new Date();
  constructor(public readonly aggregateId: string) {}
}

export class TaskCompletedEvent implements DomainEvent {
  readonly eventType = 'TaskCompleted';
  readonly occurredAt = new Date();
  constructor(public readonly aggregateId: string) {}
}

export class TaskCanceledEvent implements DomainEvent {
  readonly eventType = 'TaskCanceled';
  readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly justification: string
  ) {}
}

export class TaskMovedEvent implements DomainEvent {
  readonly eventType = 'TaskMoved';
  readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly fromLocation: string,
    public readonly toLocation: string
  ) {}
}

export class TaskSkippedEvent implements DomainEvent {
  readonly eventType = 'TaskSkipped';
  readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly skipType: 'for_now' | 'for_day'
  ) {}
}

// Session Events
export class SessionStartedEvent implements DomainEvent {
  readonly eventType = 'SessionStarted';
  readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly taskId: string
  ) {}
}

export class SessionCompletedEvent implements DomainEvent {
  readonly eventType = 'SessionCompleted';
  readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly taskId: string,
    public readonly durationSeconds: number,
    public readonly focusLevel: string
  ) {}
}

// Sprint Events
export class SprintCreatedEvent implements DomainEvent {
  readonly eventType = 'SprintCreated';
  readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly startDate: Date,
    public readonly endDate: Date
  ) {}
}

// Tag Events
export class TagCreatedEvent implements DomainEvent {
  readonly eventType = 'TagCreated';
  readonly occurredAt = new Date();
  constructor(
    public readonly aggregateId: string,
    public readonly name: string
  ) {}
}

export class TagDeletedEvent implements DomainEvent {
  readonly eventType = 'TagDeleted';
  readonly occurredAt = new Date();
  constructor(public readonly aggregateId: string) {}
}

// Routine Events
export class RoutineActivatedEvent implements DomainEvent {
  readonly eventType = 'RoutineActivated';
  readonly occurredAt = new Date();
  constructor(public readonly aggregateId: string) {}
}
