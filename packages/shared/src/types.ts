/**
 * Auto-generated TypeScript types from OpenRPC schema
 * DO NOT EDIT MANUALLY - Run `bun run generate` to regenerate
 */

// =============================================================================
// Core Schemas
// =============================================================================

export interface Task {
  /** Unique task identifier */
  id: string;
  /** Task title */
  title: string;
  /** Optional task description */
  description?: string;
  status: TaskStatus;
  tagPoints: TagPoints;
  location: TaskLocation;
  skipState?: SkipState;
  sessions: Session[];
  comments: Comment[];
  /** Parent task ID (for recurring instances or split tasks) */
  parentId?: string;
  /** RRule string for recurring tasks */
  recurrence?: string;
  createdAt: string;
  updatedAt: string;
  /** When the task was completed */
  completedAt?: string;
}

export interface Tag {
  /** Unique tag identifier */
  id: string;
  /** Tag display name */
  name: string;
  /** Icon identifier (Ionicons name) */
  icon?: string;
  /** Color hex code */
  color?: string;
  /** Default weekly capacity points */
  defaultCapacity?: number;
}

export interface Sprint {
  /** Unique sprint identifier */
  id: string;
  /** Sprint start date (Sunday) */
  startDate: string;
  /** Sprint end date (Saturday) */
  endDate: string;
  /** Per-tag capacity overrides */
  capacityOverrides?: Record<string, number>;
}

export interface Session {
  /** Unique session identifier */
  id: string;
  /** When the session started */
  startedAt: string;
  /** When the session ended */
  endedAt?: string;
  /** Planned duration in minutes */
  durationMinutes?: number;
  /** Actual duration in minutes */
  actualDurationMinutes?: number;
  status: SessionStatus;
  focusLevel?: FocusLevel;
  /** Optional session notes */
  notes?: string;
}

export interface Comment {
  /** Unique comment identifier */
  id: string;
  /** Comment text (Markdown supported) */
  content: string;
  createdAt: string;
  updatedAt?: string;
  /** Whether this comment is a skip justification */
  skipJustification?: boolean;
  /** Whether this comment is a cancel justification */
  cancelJustification?: boolean;
}

export type TaskStatus = 'active' | 'completed' | 'canceled';

export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

export type FocusLevel = 'distracted' | 'neutral' | 'focused';

export type SkipType = 'for_now' | 'for_day';

export type TagPoints = Record<string, 1 | 2 | 3 | 5 | 8 | 13 | 21>;

export type TaskLocation = {
  type: 'backlog';
} | {
  type: 'sprint';
  sprintId: string;
};

export interface SkipState {
  type: SkipType;
  skippedAt: string;
  /** When the task should return (for skip_for_day) */
  returnAt?: string;
  /** ID of the justification comment */
  justificationCommentId?: string;
}

export interface KanbanBoard {
  /** Tasks in backlog */
  backlog: Task[];
  /** Sprint columns with tasks */
  sprints: {
  sprint: Sprint;
  tasks: Task[];
}[];
}

export interface FocusData {
  /** Current task to focus on */
  focusTask?: Task | null;
  /** Upcoming tasks queue */
  upNext?: Task[];
  /** Currently active session if any */
  activeSession?: Session | null;
}

export interface DailyStats {
  date: string;
  tasksCompleted: number;
  totalPoints: number;
  totalFocusMinutes: number;
  sessionCount: number;
  /** Average focus level (0-1 scale) */
  averageFocusLevel?: number;
  /** Points completed by tag */
  pointsByTag?: Record<string, number>;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  tasksCompleted: number;
  totalPoints: number;
  totalFocusMinutes: number;
  sessionCount: number;
  averageFocusLevel?: number;
  pointsByTag?: Record<string, number>;
  /** Per-day statistics */
  dailyBreakdown: DailyStats[];
}

// =============================================================================
// Method Types
// =============================================================================

export interface TaskCreateParams {
  /** Task title (cannot be empty) */
  title: string;
  /** Optional task description */
  description?: string;
  /** Points allocation per tag (Fibonacci scale) */
  tagPoints: TagPoints;
  /** Optional sprint ID to place task directly in sprint */
  sprintId?: string;
}
export type TaskCreateResult = Task;

export interface TaskCompleteParams {
  /** Task ID */
  id: string;
}
export type TaskCompleteResult = Task;

export interface TaskCancelParams {
  /** Task ID */
  id: string;
  /** Reason for cancellation (required) */
  justification: string;
}
export type TaskCancelResult = Task;

export interface TaskSkipParams {
  /** Task ID */
  id: string;
  /** Skip type - 'for_now' moves to bottom, 'for_day' hides until tomorrow */
  type: SkipType;
  /** Reason for skipping (required for 'for_day') */
  justification: string;
}
export type TaskSkipResult = Task;

export interface TaskGetKanbanParams {
  /** Optional sprint ID to filter by */
  sprintId?: string;
}
export type TaskGetKanbanResult = KanbanBoard;

export interface TaskGetFocusParams {
  /** Optional sprint ID to filter by */
  sprintId?: string;
}
export type TaskGetFocusResult = FocusData;

export interface SessionStartParams {
  /** Task ID to start session on */
  taskId: string;
  /** Planned session duration in minutes (default 25) */
  durationMinutes?: number;
}
export type SessionStartResult = Session;

export interface SessionEndParams {
  /** Task ID the session belongs to */
  taskId: string;
  /** Session ID to end */
  sessionId: string;
  /** Self-reported focus quality */
  focusLevel: FocusLevel;
}
export type SessionEndResult = Session;

export interface TagCreateParams {
  /** Tag name (unique) */
  name: string;
  /** Icon identifier (Ionicons name) */
  icon?: string;
  /** Color hex code (e.g., */
  color?: string;
  /** Default weekly capacity points for this tag */
  defaultCapacity?: number;
}
export type TagCreateResult = Tag;

export type TagGetAllParams = void;
export type TagGetAllResult = Tag[];

export interface SprintCreateParams {
  /** Sprint start date (ISO 8601 format, must be a Sunday) */
  startDate: string;
}
export type SprintCreateResult = Sprint;

export type SprintGetCurrentParams = void;
export type SprintGetCurrentResult = Sprint | null;

export interface SprintGetUpcomingParams {
  /** Maximum number of sprints to return (default 3) */
  limit?: number;
}
export type SprintGetUpcomingResult = Sprint[];

export interface StatsGetDailyParams {
  /** Date to get stats for (ISO 8601, defaults to today) */
  date?: string;
}
export type StatsGetDailyResult = DailyStats;

export interface StatsGetWeeklyParams {
  /** Any date within the week (ISO 8601, defaults to current week) */
  date?: string;
}
export type StatsGetWeeklyResult = WeeklyStats;

// Method names union type
export type MethodName = 'task.create' | 'task.complete' | 'task.cancel' | 'task.skip' | 'task.getKanban' | 'task.getFocus' | 'session.start' | 'session.end' | 'tag.create' | 'tag.getAll' | 'sprint.create' | 'sprint.getCurrent' | 'sprint.getUpcoming' | 'stats.getDaily' | 'stats.getWeekly';

// Method handler map type
export interface MethodHandlers {
  'task.create': (params: TaskCreateParams) => Promise<TaskCreateResult>;
  'task.complete': (params: TaskCompleteParams) => Promise<TaskCompleteResult>;
  'task.cancel': (params: TaskCancelParams) => Promise<TaskCancelResult>;
  'task.skip': (params: TaskSkipParams) => Promise<TaskSkipResult>;
  'task.getKanban': (params: TaskGetKanbanParams) => Promise<TaskGetKanbanResult>;
  'task.getFocus': (params: TaskGetFocusParams) => Promise<TaskGetFocusResult>;
  'session.start': (params: SessionStartParams) => Promise<SessionStartResult>;
  'session.end': (params: SessionEndParams) => Promise<SessionEndResult>;
  'tag.create': (params: TagCreateParams) => Promise<TagCreateResult>;
  'tag.getAll': (params: void) => Promise<TagGetAllResult>;
  'sprint.create': (params: SprintCreateParams) => Promise<SprintCreateResult>;
  'sprint.getCurrent': (params: void) => Promise<SprintGetCurrentResult>;
  'sprint.getUpcoming': (params: SprintGetUpcomingParams) => Promise<SprintGetUpcomingResult>;
  'stats.getDaily': (params: StatsGetDailyParams) => Promise<StatsGetDailyResult>;
  'stats.getWeekly': (params: StatsGetWeeklyParams) => Promise<StatsGetWeeklyResult>;
}