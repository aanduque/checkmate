// Value Objects
export { TaskId } from './value-objects/TaskId';
export { TagId } from './value-objects/TagId';
export { SprintId } from './value-objects/SprintId';
export { RoutineId } from './value-objects/RoutineId';
export { CommentId } from './value-objects/CommentId';
export { SessionId } from './value-objects/SessionId';
export { Points, type PointsValue } from './value-objects/Points';
export { TagPoints } from './value-objects/TagPoints';
export { Location, type LocationType } from './value-objects/Location';
export {
  SkipState,
  type SkipType,
  type SkipStateData,
} from './value-objects/SkipState';
export {
  FocusLevel,
  type FocusLevelValue,
} from './value-objects/FocusLevel';
export { Recurrence, RecurrencePatterns } from './value-objects/Recurrence';

// Entities
export {
  Comment,
  type CommentProps,
  type CreateCommentProps,
} from './entities/Comment';
export {
  Session,
  type SessionProps,
  type SessionStatus,
} from './entities/Session';
export {
  Task,
  type TaskProps,
  type CreateTaskProps,
  type TaskStatus,
} from './entities/Task';
export { Tag, type TagProps, type CreateTagProps } from './entities/Tag';
export { Sprint, type SprintProps } from './entities/Sprint';
export {
  Routine,
  type RoutineProps,
  type CreateRoutineProps,
} from './entities/Routine';

// Repository Interfaces
export type { ITaskRepository } from './repositories/ITaskRepository';
export type { ITagRepository } from './repositories/ITagRepository';
export type { ISprintRepository } from './repositories/ISprintRepository';
export type { IRoutineRepository } from './repositories/IRoutineRepository';

// Domain Services
export {
  SprintHealthService,
  type SprintHealthStatus,
  type TagHealthDetail,
  type SprintHealthReport,
} from './services/SprintHealthService';
export { SprintService } from './services/SprintService';
export { TaskService } from './services/TaskService';
export {
  RoutineService,
  type RoutineContext,
  type ActivationEvaluator,
} from './services/RoutineService';
export {
  StatsService,
  type DailyStats,
  type TagPerformance,
  type WeeklyStats,
} from './services/StatsService';

// Domain Events
export type {
  DomainEvent,
  TaskCreated,
  TaskCompleted,
  TaskCanceled,
  SessionStarted,
  SessionCompleted,
  SessionAbandoned,
  TaskMovedToSprint,
  TaskMovedToBacklog,
  TaskSkipped,
  CheckMateEvent,
} from './events/DomainEvent';
