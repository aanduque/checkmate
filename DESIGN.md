# Check Mate - Domain Model Design

## Context

Check Mate is a mobile-first ADHD-focused productivity application that combines task management with sprint-based planning, Pomodoro-style work sessions, and intelligent routine-based filtering. The application targets individuals who benefit from structured work periods, clear capacity limits, and contextual task visibility.

### Core Philosophy

- **Constraint-based productivity**: Users define capacity limits per tag to prevent overcommitment
- **Contextual awareness**: Routines automatically filter tasks based on time and context
- **Gentle accountability**: Skip mechanisms with justifications encourage reflection without punishment
- **Focus-first**: Pomodoro sessions attached to tasks promote deep work

### Problem Space

Users with ADHD often struggle with:
- Overcommitting to tasks without realistic capacity assessment
- Context switching between different life domains (work, personal, etc.)
- Maintaining focus during work periods
- Task prioritization and visibility overwhelm

Check Mate addresses these through sprint-based capacity planning, automatic routine-based filtering, and integrated focus sessions.

---

## Domain Model

### Ubiquitous Language

| Term | Definition |
|------|------------|
| **Backlog** | The pool of all tasks not assigned to any sprint |
| **Sprint** | A one-week time-boxed period (Sunday to Saturday) for task execution |
| **Tag** | A categorization label with associated capacity and visual properties |
| **Points** | Fibonacci-based effort estimation (~1 point = 1 hour); assigned per tag on a task |
| **Routine** | A named filter configuration that activates automatically based on temporal conditions |
| **Session** | A Pomodoro-style focused work period attached to a specific task |
| **Skip** | Temporarily deprioritizing a task either "for now" (bottom of sprint) or "for the day" (hidden until tomorrow) |
| **Capacity** | The maximum points a user can commit to per tag per sprint |
| **Sprint Health** | Calculated status (on-track, at-risk, off-track) based on points vs. capacity vs. remaining days |

---

### Aggregates

#### Task Aggregate (Root: Task)

The Task is the central aggregate, owning its comments, sessions, skip state, and point allocations.

```
Task (Aggregate Root)
├── id: TaskId
├── title: string
├── description?: string
├── status: TaskStatus
├── tagPoints: Map<TagId, Points>
├── location: TaskLocation
├── createdAt: Date
├── skipState?: SkipState
├── recurrence?: RRule
├── parentId?: TaskId
├── externalSource?: ExternalSource
├── comments: Comment[]
└── sessions: Session[]
```

**Invariants:**
- A task must have at least one tag (defaults to "untagged" system tag)
- Points must be positive integers from Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21
- A task cannot be in multiple sprints simultaneously
- A task with `recurrence` set is a template and cannot be moved to a sprint
- A task with `parentId` cannot have its parent changed (immutable relationship)
- Canceled tasks cannot transition to any other status
- Only active tasks can have sessions started on them

#### Sprint Aggregate (Root: Sprint)

Sprints are time-bounded containers that reference tasks and track capacity overrides.

```
Sprint (Aggregate Root)
├── id: SprintId
├── startDate: Date (always a Sunday)
├── endDate: Date (always a Saturday)
├── capacityOverrides: Map<TagId, Points>
└── taskIds: Set<TaskId>
```

**Invariants:**
- Sprint duration is exactly 7 days
- startDate must be a Sunday
- Only 3 sprints can exist at any time: current, next, next-next
- A sprint cannot contain recurring task templates
- Sprint dates cannot overlap with other sprints

#### Routine Aggregate (Root: Routine)

Routines define filtered views that activate based on temporal expressions.

```
Routine (Aggregate Root)
├── id: RoutineId
├── name: string
├── description?: string
├── icon: string
├── color: string
├── priority: number (1-10, default 5)
├── taskFilterExpression: FilterExpression
└── activationExpression: FilterExpression
```

**Invariants:**
- Priority must be between 1 and 10
- Both expressions must be valid Filtrex syntax
- Name must be unique per user

#### Tag Aggregate (Root: Tag)

Tags are pre-defined categorization entities with visual properties and default capacity.

```
Tag (Aggregate Root)
├── id: TagId
├── name: string
├── description?: string
├── icon: string
├── color: string
└── defaultCapacity: Points
```

**Invariants:**
- Name must be unique per user
- A system "untagged" tag always exists and cannot be deleted
- defaultCapacity must be a positive integer

---

### Entities

#### Comment

```
Comment (Entity within Task)
├── id: CommentId
├── content: string (Markdown)
├── createdAt: Date
├── updatedAt?: Date
└── skipJustification: boolean
```

Comments are owned by Tasks. The `skipJustification` flag indicates this comment was created as part of a "skip for day" action.

#### Session

```
Session (Entity within Task)
├── id: SessionId
├── status: SessionStatus
├── startedAt: Date
├── endedAt?: Date
├── focusLevel?: FocusLevel
└── comments: Comment[]
```

Sessions represent Pomodoro-style work periods. They are owned by Tasks and cannot exist independently.

---

### Value Objects

#### TaskId, SprintId, RoutineId, TagId, CommentId, SessionId
Strongly-typed identifiers (UUIDs) preventing accidental mixing of ID types.

#### Points
```
Points: 1 | 2 | 3 | 5 | 8 | 13 | 21
```
Constrained to Fibonacci sequence. Enforced at construction.

#### TaskStatus
```
TaskStatus: 'active' | 'completed' | 'canceled'
```

#### TaskLocation
```
TaskLocation: 
  | { type: 'backlog' }
  | { type: 'sprint', sprintId: SprintId }
```

#### SkipState
```
SkipState: {
  type: 'for_now' | 'for_day'
  skippedAt: Date
  returnAt?: Date  // Required for 'for_day', set to start of next day
  justificationCommentId?: CommentId  // Required for 'for_day'
}
```

#### SessionStatus
```
SessionStatus: 'in_progress' | 'completed' | 'abandoned'
```

#### FocusLevel
```
FocusLevel: 'distracted' | 'neutral' | 'focused'
```

#### FilterExpression
```
FilterExpression: string  // Filtrex-compatible expression
```

Validated at construction via Filtrex compilation.

#### RRule
```
RRule: string  // RFC 5545 RRULE format, parsed via rrule library
```

#### ExternalSource
```
ExternalSource: {
  system: 'jira' | 'github'
  externalId: string
  lastSyncedAt: Date
}
```

#### SprintHealth
```
SprintHealth: 'on_track' | 'at_risk' | 'off_track'
```

#### TagPoints
```
TagPoints: Map<TagId, Points>
```
Represents the effort allocation of a task across its tags.

---

### Domain Services

#### SprintHealthCalculator

Calculates the health status of a sprint based on assigned points, capacity, and remaining time.

```typescript
interface SprintHealthCalculator {
  calculate(sprint: Sprint, tasks: Task[], capacities: Map<TagId, Points>, today: Date): SprintHealthReport
}

interface SprintHealthReport {
  overallHealth: SprintHealth
  tagHealths: Map<TagId, TagHealthDetail>
  warnings: string[]
}

interface TagHealthDetail {
  health: SprintHealth
  assignedPoints: Points
  availableCapacity: Points
  dailyBurnRateNeeded: number
  sustainableDailyRate: number
}
```

**Algorithm:**
```
For each tag in sprint:
  assignedPoints = sum of points for this tag across all tasks in sprint
  availableCapacity = capacityOverride ?? defaultCapacity
  daysRemaining = max(1, sprintEnd - today)
  dailyBurnRateNeeded = assignedPoints / daysRemaining
  sustainableDailyRate = availableCapacity / 7

  if dailyBurnRateNeeded > sustainableDailyRate * 1.5 → OFF_TRACK
  if dailyBurnRateNeeded > sustainableDailyRate * 1.2 → AT_RISK
  else → ON_TRACK

Sprint overall health = worst health across all tags
```

#### RecurringTaskSpawner

Spawns task instances from recurring task templates based on their RRule.

```typescript
interface RecurringTaskSpawner {
  spawnDueInstances(
    templates: Task[],  // Tasks with recurrence set
    existingInstances: Task[],  // Tasks with parentId matching templates
    dateRange: { start: Date, end: Date }
  ): Task[]  // Newly spawned instances
}
```

**Logic:**
1. For each template, compute next N occurrences within dateRange using rrule
2. For each occurrence date, check if an instance already exists (by parentId + dueDate)
3. If not, create new Task instance with:
   - Copied title, description, tagPoints from template
   - parentId = template.id
   - status = 'active'
   - location = { type: 'backlog' }

#### ActiveRoutineDeterminer

Determines which routine should be active at a given moment.

```typescript
interface ActiveRoutineDeterminer {
  determine(routines: Routine[], context: RoutineContext): Routine | null
}

interface RoutineContext {
  now: Date
  dayOfWeek: string  // 'mon', 'tue', etc.
  hour: number
  minute: number
}
```

**Logic:**
1. Filter routines where `activationExpression` evaluates to true
2. If multiple match, select highest priority
3. If tie, select alphabetically by name
4. If none match, return null (default "show all" behavior)

---

## Application Layer

### Commands

Commands represent intentions to modify state. Each command has a corresponding handler.

#### Task Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `CreateTask` | title, description?, tagPoints, recurrence? | Creates task in backlog |
| `UpdateTask` | taskId, title?, description?, tagPoints? | Updates mutable task fields |
| `CompleteTask` | taskId | Transitions task to completed status |
| `CancelTask` | taskId, reason? | Transitions task to canceled status |
| `MoveTaskToSprint` | taskId, sprintId | Moves task from backlog/sprint to target sprint |
| `MoveTaskToBacklog` | taskId | Returns task to backlog |
| `SkipTaskForNow` | taskId | Pushes task to bottom of current sprint |
| `SkipTaskForDay` | taskId, justification | Hides task until tomorrow, creates justification comment |
| `ClearSkipState` | taskId | Removes skip state from task |
| `AddTaskComment` | taskId, content | Adds comment to task |
| `UpdateTaskComment` | taskId, commentId, content | Updates existing comment |
| `DeleteTaskComment` | taskId, commentId | Removes comment from task |

#### Session Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `StartSession` | taskId | Creates new in_progress session on task |
| `CompleteSession` | taskId, sessionId, focusLevel?, comment? | Ends session as completed |
| `AbandonSession` | taskId, sessionId | Ends session as abandoned |
| `AddSessionComment` | taskId, sessionId, content | Adds comment to session |

#### Sprint Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `SetSprintCapacityOverride` | sprintId, tagId, capacity | Sets capacity override for tag in sprint |
| `ClearSprintCapacityOverride` | sprintId, tagId | Removes capacity override, uses default |

#### Tag Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `CreateTag` | name, description?, icon, color, defaultCapacity | Creates new tag |
| `UpdateTag` | tagId, name?, description?, icon?, color?, defaultCapacity? | Updates tag properties |
| `DeleteTag` | tagId | Deletes tag (fails if tasks use it) |

#### Routine Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `CreateRoutine` | name, description?, icon, color, priority, taskFilterExpression, activationExpression | Creates new routine |
| `UpdateRoutine` | routineId, ...fields | Updates routine properties |
| `DeleteRoutine` | routineId | Deletes routine |

#### AI Action Commands

| Command | Parameters | Description |
|---------|------------|-------------|
| `SplitTask` | taskId, splitInstructions? | Triggers AI to split task into subtasks |

### Queries

Queries retrieve data without side effects.

| Query | Parameters | Returns | Description |
|-------|------------|---------|-------------|
| `GetTask` | taskId | Task | Single task with comments and sessions |
| `GetBacklogTasks` | filters? | Task[] | All tasks in backlog |
| `GetSprintTasks` | sprintId, filters? | Task[] | Tasks in specific sprint |
| `GetCurrentSprint` | - | Sprint | The sprint containing today |
| `GetUpcomingSprints` | - | Sprint[] | Next and next-next sprints |
| `GetSprintHealth` | sprintId | SprintHealthReport | Calculated health for sprint |
| `GetActiveRoutine` | now | Routine? | Currently active routine |
| `GetFilteredTasks` | filterExpression, scope | Task[] | Tasks matching filter across scope |
| `GetTags` | - | Tag[] | All defined tags |
| `GetRoutines` | - | Routine[] | All defined routines |
| `GetRecurringTemplates` | - | Task[] | All tasks with recurrence set |
| `GetTaskHistory` | taskId | TaskEvent[] | Audit trail for task |

### Ports (Interfaces for Infrastructure)

```typescript
// Persistence
interface TaskRepository {
  save(task: Task): Promise<void>
  findById(id: TaskId): Promise<Task | null>
  findByLocation(location: TaskLocation): Promise<Task[]>
  findByParentId(parentId: TaskId): Promise<Task[]>
  findTemplates(): Promise<Task[]>  // Tasks with recurrence
}

interface SprintRepository {
  save(sprint: Sprint): Promise<void>
  findById(id: SprintId): Promise<Sprint | null>
  findByDateRange(start: Date, end: Date): Promise<Sprint[]>
  findCurrent(today: Date): Promise<Sprint | null>
}

interface TagRepository {
  save(tag: Tag): Promise<void>
  findById(id: TagId): Promise<Tag | null>
  findAll(): Promise<Tag[]>
  findByName(name: string): Promise<Tag | null>
}

interface RoutineRepository {
  save(routine: Routine): Promise<void>
  findById(id: RoutineId): Promise<Routine | null>
  findAll(): Promise<Routine[]>
}

// Expression Evaluation
interface FilterExpressionEvaluator {
  compile(expression: FilterExpression): CompiledFilter
  validate(expression: FilterExpression): ValidationResult
}

interface CompiledFilter {
  evaluate(context: Record<string, unknown>): boolean
}

// Recurrence
interface RecurrenceCalculator {
  parse(rrule: string): ParsedRRule
  getOccurrences(rrule: ParsedRRule, range: { start: Date, end: Date }): Date[]
  getNextOccurrence(rrule: ParsedRRule, after: Date): Date | null
}

// AI Integration
interface TaskSplitterAI {
  split(task: Task, instructions?: string): Promise<SplitResult>
}

interface SplitResult {
  subtasks: Array<{
    title: string
    description?: string
    tagPoints: Map<TagId, Points>
  }>
  reasoning: string
}

// Clock (for testability)
interface Clock {
  now(): Date
  today(): Date  // Start of current day
  startOfWeek(date: Date): Date  // Sunday
  endOfWeek(date: Date): Date  // Saturday
}
```

---

## Design Rationale

### Why Points Per Tag?

**Business requirement:** Users allocate effort differently across life domains. A task might require 5 hours of "work" effort but only 2 hours of "coding" effort (if coding is faster for this user).

**Alternatives considered:**
1. Single point value per task → Doesn't support multi-dimensional capacity tracking
2. Points on tags globally → Conflates task effort with tag importance

**Complexity justification:** The Map<TagId, Points> structure is marginally more complex but directly models the user's mental model of effort allocation.

### Why Separate Template and Instance for Recurring Tasks?

**Business requirement:** Recurring tasks spawn independent instances that can be completed, skipped, or modified without affecting the recurrence pattern.

**Alternatives considered:**
1. Single task that "resets" on completion → Loses history of individual completions
2. Clone on completion → Confusing UX; when does cloning happen?

**Chosen approach:** Template in backlog, spawns instances on-demand. Uses existing `parentId` field (shared with AI-split), minimizing new concepts.

### Why Filtrex for Expressions?

**Business requirement:** Users need a query language for routines that is both powerful and safe.

**Alternatives considered:**
1. Custom DSL → High implementation effort, maintenance burden
2. Raw JavaScript → Security nightmare
3. JSON-based query builder → Less expressive, clunky UX

**Chosen approach:** Filtrex provides a spreadsheet-like syntax that is sandboxed, extensible, and battle-tested (300K+ weekly npm downloads).

### Why Skip State Instead of Task Status?

**Business requirement:** Skipped tasks are still active; they're just temporarily deprioritized or hidden.

**Alternatives considered:**
1. `skipped_for_now` and `skipped_for_day` as statuses → Conflates visibility with lifecycle
2. Separate ordering field → Doesn't handle the "hidden until tomorrow" case

**Chosen approach:** `SkipState` value object captures the transient nature of skipping while preserving the primary status lifecycle.

### Why Task Owns Sessions?

**Business requirement:** Sessions are meaningless without their associated task. They don't transfer or exist independently.

**Alternatives considered:**
1. Separate Session aggregate → Adds complexity for cross-aggregate queries
2. Session references Task → Same complexity, weaker consistency

**Chosen approach:** Session as entity within Task aggregate ensures atomicity of session operations with task state.

---

## Future Considerations

### External Sync (Jira, GitHub)

The `externalSource` field on Task enables read-only sync. Application layer will:
1. Reject mutations on tasks where `externalSource` is present
2. Sync service will update tasks by bypassing normal command handlers
3. Point mapping configured at integration setup time

### Calendar Integration

Will require new port:
```typescript
interface CalendarPort {
  getEvents(range: { start: Date, end: Date }): Promise<CalendarEvent[]>
}
```

Sprint capacity calculation will subtract meeting durations (mapped to tags via configuration).

### Multi-device Sync

Current design is sync-agnostic. Aggregates can be serialized to JSON. Event sourcing could be added later if conflict resolution becomes complex.

---

## Appendix: Expression Context

### Task Filter Context (available in taskFilterExpression)

```typescript
interface TaskFilterContext {
  // Task properties
  title: string
  description: string
  status: 'active' | 'completed' | 'canceled'
  age: number  // Days since creation
  sprintCount: number  // How many sprints this task has been part of
  
  // Location
  inBacklog: boolean
  inSprint: boolean
  sprintWeek: 'current' | 'next' | 'next_next' | null
  
  // Points (all variants)
  points: {
    total: number
    [tagName: string]: number  // e.g., points.work, points.personal
  }
  
  // Functions
  hasTag(tagName: string): boolean
  hasAnyTag(...tagNames: string[]): boolean
  hasAllTags(...tagNames: string[]): boolean
}
```

### Routine Activation Context (available in activationExpression)

```typescript
interface ActivationContext {
  // Temporal
  now: Date
  dayOfWeek: 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat'
  hour: number  // 0-23
  minute: number  // 0-59
  date: number  // Day of month 1-31
  month: number  // 1-12
  year: number
  
  // Helpers
  isWeekday: boolean
  isWeekend: boolean
  time: number  // Minutes since midnight (hour * 60 + minute)
}
```

### Example Expressions

**Task filter - Work tasks with high effort:**
```
hasTag("work") and points.work >= 5
```

**Task filter - Overdue items:**
```
age > 14 and status == "active"
```

**Activation - Weekday mornings:**
```
isWeekday and hour >= 9 and hour < 12
```

**Activation - Specific days and times:**
```
dayOfWeek in ["mon", "wed", "fri"] and time >= 540 and time < 720
```
