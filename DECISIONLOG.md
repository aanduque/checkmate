# Check Mate - Decision Log

This document records design decisions in chronological order, capturing the context, options considered, and rationale for each choice.

---

## DEC-001: Sprint Duration and Boundaries

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** Need to define how sprints are structured temporally.

**Decision:**  
- Sprints are exactly 1 week long
- Start on Sunday, end on Saturday
- Internally stored as start/end dates
- Current sprint is automatically determined by today's date
- Always maintain exactly 3 sprints: current, next, next-next

**Options Considered:**
1. User-defined arbitrary date ranges
2. Fixed 1-week with configurable start day
3. Fixed 1-week Sunday–Saturday (chosen)

**Rationale:**  
Simplicity for PoC. Fixed boundaries eliminate edge cases around partial weeks and make sprint transitions automatic. Sunday start aligns with common calendar conventions.

**Consequences:**
- Sprint transitions happen automatically at midnight Saturday→Sunday
- No manual sprint creation/closure needed
- Future: May add flexibility for different start days

---

## DEC-002: Points-Per-Tag Model

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** How should effort estimation work when tasks have multiple tags?

**Decision:**  
Tasks store points as `Map<TagId, Points>` — each tag on a task has its own point allocation.

**Example:**
```
Task: "Build API endpoint"
├── #work: 5 points
├── #backend: 3 points
```

**Options Considered:**
1. Single point value per task → Doesn't support multi-dimensional capacity
2. Points inherited from tags → Conflates effort with categorization
3. Points per tag on task (chosen) → Explicit effort allocation per domain

**Rationale:**  
Users think about effort differently across life domains. A task might be 5 hours of "work" but only 3 hours of "technical" effort. This model directly captures that mental model.

**Consequences:**
- UI must prompt for points per tag when creating/editing tasks
- Capacity tracking is per-tag, not aggregate
- Query filters can reference specific tag points (e.g., `points.work >= 3`)

---

## DEC-003: Fibonacci Points Constraint

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** What values are valid for points?

**Decision:**  
Points are constrained to Fibonacci sequence: 1, 2, 3, 5, 8, 13, 21. Zero is not allowed.

**Rationale:**  
- Fibonacci naturally handles estimation uncertainty (larger tasks = less precision)
- 1 point ≈ 1 hour provides intuitive baseline
- Disallowing zero forces users to acknowledge even trivial tasks have effort
- Industry-standard approach (Scrum, agile estimation)

**Consequences:**
- Value object enforces valid values at construction
- UI presents picker with valid options only

---

## DEC-004: Recurring Tasks as Templates

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** How should recurring tasks work?

**Decision:**  
- Recurring tasks are **templates** that live in the backlog permanently
- Templates **spawn instances** that can be moved to sprints
- Instances link to templates via `parentId` field
- Spawning happens **on-demand** when viewing backlog/sprint (with caching)
- Instances are independent after creation (can be edited, completed, etc.)

**Options Considered:**
1. Task "resets" on completion → Loses completion history
2. Clone on completion → Confusing timing of clone creation
3. Template + instance model (chosen) → Clear separation of pattern vs. occurrence

**Rationale:**  
The template/instance model provides clean semantics. Templates define "what should recur," instances represent "this specific occurrence." Using the existing `parentId` field (shared with AI-split) minimizes new concepts.

**Consequences:**
- Templates cannot be moved to sprints (enforced invariant)
- Query for "recurring templates" is straightforward
- Instance spawning logic encapsulated in `RecurringTaskSpawner` domain service

---

## DEC-005: Skip State as Value Object

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** How to model the "skip for now" and "skip for day" mechanics?

**Decision:**  
Skip is modeled as optional `SkipState` value object on Task, not as a task status.

```typescript
SkipState: {
  type: 'for_now' | 'for_day'
  skippedAt: Date
  returnAt?: Date  // For 'for_day' only
  justificationCommentId?: CommentId  // For 'for_day' only
}
```

**Options Considered:**
1. Additional task statuses (`skipped_now`, `skipped_day`) → Conflates visibility with lifecycle
2. Separate ordering field → Doesn't handle "hidden until tomorrow"
3. Optional SkipState value object (chosen) → Captures transient nature

**Rationale:**  
Skipping is a temporary visibility/ordering concern, not a lifecycle state. A skipped task is still "active" — it's just deprioritized or hidden temporarily.

**Consequences:**
- Task status remains simple: active, completed, canceled
- Ordering logic checks SkipState for positioning
- "Skip for day" creates justification comment linked via ID
- Clear separation of concerns

---

## DEC-006: Skip Ordering Behavior

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** How should skipped tasks appear in the list?

**Decision:**
- `skip_for_now`: Task appears at **bottom** of current sprint
- `skip_for_day`: Task is **hidden** until returnAt, then appears at **top** of sprint
- After appearing at top, the skip state is cleared

**Rationale:**  
"Skip for day" implies the task is important enough to warrant a justification — it deserves priority attention when it returns. "Skip for now" is a gentle "deal with this later" within the same day.

**Consequences:**
- Ordering algorithm must check SkipState
- UI may need to visually distinguish "returned from skip" tasks

---

## DEC-007: Filtrex for Expression Language

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** Routines need a query language for both task filtering and activation conditions.

**Decision:**  
Use [Filtrex](https://github.com/joewalnes/filtrex) library for expression evaluation.

**Options Considered:**
1. Custom DSL → High implementation effort, maintenance burden
2. Raw JavaScript eval → Security nightmare
3. JSON-based query builder → Less expressive, poor UX
4. Filtrex (chosen) → Sandboxed, extensible, proven (300K+ weekly downloads)
5. Jexl → More powerful but heavier, async-focused

**Rationale:**  
Filtrex provides a spreadsheet-like syntax that is:
- **Safe**: Cannot escape sandbox or execute arbitrary code
- **Simple**: Familiar to spreadsheet users
- **Extensible**: Custom functions for domain concepts (`hasTag()`, etc.)
- **Fast**: Compiles to JS functions

**Consequences:**
- Domain defines expression context (available variables and functions)
- Infrastructure implements `FilterExpressionEvaluator` port using Filtrex
- Expressions validated at creation time (fail fast)

---

## DEC-008: Task Aggregate Owns Sessions

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** Where do Sessions belong in the aggregate structure?

**Decision:**  
Sessions are entities within the Task aggregate, not a separate aggregate.

**Options Considered:**
1. Session as separate aggregate → Complex cross-aggregate queries
2. Session references Task (association) → Same complexity, weaker consistency
3. Session within Task aggregate (chosen) → Atomic operations, simple queries

**Rationale:**  
Sessions have no meaning without their task. They don't transfer between tasks. All session operations naturally require task context. Embedding in Task aggregate ensures consistency.

**Consequences:**
- `Task.sessions: Session[]` contains all sessions
- Session commands operate through Task aggregate
- No orphaned sessions possible

---

## DEC-009: Session Lifecycle Simplification

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** What states can a session be in?

**Decision:**  
Simplified session states: `in_progress`, `completed`, `abandoned`

**Options Considered:**
1. Full lifecycle (started, paused, resumed, completed, abandoned)
2. Simplified (in_progress, completed, abandoned) — chosen

**Rationale:**  
For PoC, pause/resume adds complexity without clear value. Users can abandon and start new sessions. Abandoned sessions are **marked** (not deleted) to preserve attempt history for analytics.

**Consequences:**
- No pause functionality initially
- Abandoned sessions visible in task history
- Future: Could add pause if needed

---

## DEC-010: Default "Untagged" Tag

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** What happens when a task has no tags?

**Decision:**  
Tasks must have at least one tag. A system "untagged" tag exists by default and cannot be deleted. Tasks without explicit tags get this tag automatically.

**Rationale:**  
- Simplifies capacity tracking (all points belong to some tag)
- Provides consistent filtering behavior
- Users can set capacity for untagged work

**Consequences:**
- Tag repository seeds "untagged" tag
- Tag deletion fails if it's the system tag
- UI can hide "untagged" when other tags present

---

## DEC-011: External Sync Handling

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** How to handle tasks synced from external systems (Jira, GitHub)?

**Decision:**  
- Tasks have optional `externalSource` field with system, externalId, lastSyncedAt
- Application layer enforces read-only: mutations rejected if externalSource present
- Domain model is unaware of read-only constraint

**Options Considered:**
1. Separate SyncedTask entity → Duplicates Task structure
2. Read-only flag in domain → Domain shouldn't know about sync
3. Application layer enforcement (chosen) → Clean separation

**Rationale:**  
The read-only constraint is a policy decision, not a domain invariant. Keeping it in application layer allows flexibility (e.g., admin override).

**Consequences:**
- Command handlers check externalSource before mutating
- Sync service bypasses normal command handlers
- Future: Sync configuration maps external fields to Check Mate concepts

---

## DEC-012: Sprint Health Algorithm

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** How to calculate if a sprint is on-track, at-risk, or off-track?

**Decision:**  
Algorithm based on daily burn rate vs. sustainable rate:

```
For each tag in sprint:
  assignedPoints = sum of points for this tag
  daysRemaining = max(1, sprintEnd - today)
  dailyBurnRateNeeded = assignedPoints / daysRemaining
  sustainableDailyRate = availableCapacity / 7

  if dailyBurnRateNeeded > sustainableDailyRate * 1.5 → OFF_TRACK
  if dailyBurnRateNeeded > sustainableDailyRate * 1.2 → AT_RISK
  else → ON_TRACK

Sprint overall = worst health across all tags
```

**Rationale:**  
This approach accounts for:
- Remaining time (urgency increases as sprint progresses)
- Per-tag capacity (respects multi-dimensional planning)
- Realistic thresholds (20% over = warning, 50% over = critical)

**Consequences:**
- Health is recalculated on every view (stateless)
- Early sprint days are more forgiving
- Single struggling tag can make whole sprint at-risk

---

## DEC-013: Task Status Model

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** What lifecycle states can a task have?

**Decision:**  
Three statuses: `active`, `completed`, `canceled`

- `active`: Default, can be worked on
- `completed`: Done, terminal state
- `canceled`: Abandoned or replaced (e.g., by AI split), terminal state

**Transitions:**
- active → completed (user completes)
- active → canceled (user cancels OR AI splits task)
- completed/canceled → (no transitions, terminal)

**Rationale:**  
Minimal status set covers all use cases. Skipping is handled separately (not a status). AI-split tasks are canceled with children created.

**Consequences:**
- Simple state machine
- Canceled tasks remain for history
- AI split: parent canceled, children created

---

## DEC-014: Parent Field for Task Relationships

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** How to model relationships between tasks (recurring instances, AI-split subtasks)?

**Decision:**  
Single `parentId` field on Task, used for:
1. Recurring: Instance → Template
2. AI Split: Subtask → Original Task

The field is immutable after creation.

**Options Considered:**
1. Separate fields for each relationship type
2. Generic parent with discriminator
3. Single parentId, context determines meaning (chosen)

**Rationale:**  
Both relationships have identical semantics: "this task was derived from that task." No need for separate fields. Immutability prevents confusing re-parenting.

**Consequences:**
- Query "children of X" works for both use cases
- UI can distinguish by checking if parent has recurrence (→ instance) or status canceled (→ split result)
- Simple data model

---

## DEC-015: Routine Priority and Conflict Resolution

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** What happens when multiple routines match the current time?

**Decision:**
1. Filter routines where activationExpression evaluates to true
2. Select routine with highest priority (1-10 scale)
3. If tie, select alphabetically by name
4. If no routines match, no filter applied (show all)

**Rationale:**  
Priority provides explicit user control. Alphabetical tie-breaker is deterministic and predictable. "Show all" as default is least surprising.

**Consequences:**
- Users should set priorities thoughtfully
- No complex conflict resolution logic needed
- Default routine could be created with "true" activation if always-on filter wanted

---

## DEC-016: Comment Model

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** What metadata do comments need?

**Decision:**  
Comments have:
- `id`: Unique identifier
- `content`: Markdown string
- `createdAt`: Timestamp
- `updatedAt`: Optional, set on edit
- `skipJustification`: Boolean flag for skip-related comments

**Options Considered:**
1. Plain text only → Limits expressiveness
2. Rich text (HTML) → Complexity, security concerns
3. Markdown (chosen) → Balance of expressiveness and simplicity

**Rationale:**  
Markdown is widely understood, easy to render, and sufficient for task notes. The `skipJustification` flag enables UI to display skip-related comments distinctively.

**Consequences:**
- UI needs Markdown renderer
- Skip justification comments linked via ID in SkipState
- Comments can be edited and deleted

---

## DEC-017: No Attachment Support Initially

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** Should comments support file attachments?

**Decision:**  
No attachments for PoC. Comments are text-only (Markdown).

**Rationale:**  
Attachments add significant complexity:
- Storage infrastructure
- Mobile upload handling
- Sync considerations
- Security (file type validation)

Text-only covers core use cases. Attachments can be added later.

**Consequences:**
- Simpler implementation
- Users can link to external files (URLs in Markdown)
- Future: Add attachment support if validated need

---

## DEC-018: Scope of Routine Filtering

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** Does routine filtering apply to backlog, sprints, or both?

**Decision:**  
Routine task filters apply to **everything** — backlog and all sprints.

**Rationale:**  
Routines represent "what I should focus on right now." This context applies regardless of where tasks live. A "work" routine should show work tasks whether they're in backlog or current sprint.

**Consequences:**
- Query layer applies filter across all task sources
- Filter expression has access to location context (`inBacklog`, `inSprint`, `sprintWeek`)
- Users can include location in filter if needed (e.g., `hasTag("work") and inSprint`)

---

## DEC-019: Task Movement Between Sprints

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** Can tasks move backwards (sprint → backlog, current → next sprint)?

**Decision:**  
Yes, tasks can move in any direction:
- Backlog → Any sprint
- Sprint → Different sprint
- Sprint → Backlog

**Rationale:**  
Flexibility supports real workflow needs:
- Overcommitted sprint → move tasks out
- Discovered blocker → defer to next sprint
- Changed priorities → return to backlog

**Consequences:**
- No directional constraints on MoveTaskToSprint/MoveTaskToBacklog commands
- Sprint health recalculates after moves

---

## DEC-020: RRULE for Recurrence

**Date:** 2025-01-07  
**Status:** Accepted  
**Context:** What format for specifying task recurrence?

**Decision:**  
Use RFC 5545 RRULE format, parsed via the `rrule` library.

**Examples:**
- `FREQ=DAILY` — Every day
- `FREQ=WEEKLY;BYDAY=MO,WE,FR` — Mon/Wed/Fri
- `FREQ=MONTHLY;BYMONTHDAY=1` — First of each month

**Rationale:**  
RRULE is an industry standard with:
- Comprehensive expressiveness
- Well-tested library support
- Human-readable format
- Calendar interoperability

**Consequences:**
- Domain stores rrule as string
- `RecurrenceCalculator` port wraps rrule library
- UI provides builder for common patterns, advanced users can edit raw rrule

---

*End of Decision Log*
