# Check Mate - Claude Code Guidelines

## Project Overview

Check Mate is an ADHD-friendly task management application being refactored from a POC (Alpine.js monolith in `poc/index.html`) to a production MVP using Domain-Driven Design (DDD).

## Technology Stack

| Layer | Technology |
|-------|------------|
| Package Manager | Bun |
| Monorepo | Bun Workspaces |
| Build Tool | Vite |
| Testing | Vitest (TDD: red-green-refactor) |
| Frontend | React + Statux + Crossroad |
| Styling | Tailwind CSS + daisyUI |
| Icons | Ionicons |
| Backend | JSON-RPC Server (Bun) |
| API Schema | OpenRPC (YAML → JSON → TypeScript) |

## Development Methodology

**TDD (Test-Driven Development)** is mandatory:
1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to make the test pass
3. **REFACTOR**: Improve code while keeping tests green

## Project Structure

```
checkmate/
├── apps/
│   ├── web/              # React frontend (Vite + React)
│   └── server/           # JSON-RPC server (@open-rpc/server-js)
├── packages/
│   ├── domain/           # Pure business logic (no dependencies)
│   ├── application/      # Use cases (commands/queries)
│   ├── infrastructure/   # Persistence, adapters for external libs
│   └── shared/           # OpenRPC schema + generated types
├── poc/                  # POC reference (read-only)
│   └── index.html        # Original Alpine.js monolith
└── PROJECT.md            # Detailed refactoring guide
```

See DEC-025 in DECISIONLOG.md for rationale on apps vs packages organization.

## Architecture

**Hexagonal Architecture (Ports & Adapters):**
- Domain layer defines ports (interfaces) for external capabilities
- Infrastructure layer implements adapters using actual libraries
- External libraries (Filtrex, RRule) never leak into domain

```
Domain Ports (interfaces):
├── IFilterExpressionEvaluator    # For routine expressions
├── IRecurrenceCalculator         # For recurring tasks

Infrastructure Adapters:
├── FiltrexExpressionEvaluator    # Implements via Filtrex
├── RRuleRecurrenceCalculator     # Implements via RRule
```

See `DECISIONLOG.md` for detailed architecture decisions (DEC-021 through DEC-024).

## Common Commands

```bash
# Development
bun dev                   # Start both server and client
bun dev:server            # Start JSON-RPC server only
bun dev:web               # Start Vite dev server only

# Testing
bun test                  # Run all tests
bun test:watch            # Watch mode
bun run --filter @checkmate/domain test  # Test specific package

# Build
bun run build             # Build all packages
```

## Core Domain Concepts

### Entities
- **Task**: Core entity with title, description, status, tagPoints, location, sessions, comments
- **Tag**: Category with icon, color, defaultCapacity (Fibonacci points)
- **Sprint**: Weekly container (Sunday-Saturday) with capacity overrides
- **Routine**: Time-based filter with activation/task expressions
- **Session**: Focus session with duration, focusLevel, embedded in Task
- **Comment**: Note with optional skipJustification/cancelJustification flags

### Value Objects
- **TaskId**: Unique identifier
- **TagPoints**: Record<tagId, number> using Fibonacci scale [1,2,3,5,8,13,21]
- **Location**: { type: 'backlog' } | { type: 'sprint', sprintId: string }
- **SkipState**: { type: 'for_now' | 'for_day', returnAt?, justificationCommentId? }
- **FocusLevel**: 'distracted' | 'neutral' | 'focused'
- **Recurrence**: RRule string for recurring tasks

### Business Rules

1. **Task Creation**
   - Title cannot be empty
   - Must have at least one tag with points
   - Points must use Fibonacci scale: [1, 2, 3, 5, 8, 13, 21]

2. **Task Lifecycle**
   - Status: 'active' → 'completed' | 'canceled'
   - Cancel requires justification (creates comment with cancelJustification flag)
   - Skip for day requires justification (creates comment with skipJustification flag)

3. **Sprint Management**
   - Rolling 3-sprint window (current, next, +2 weeks)
   - Weekly sprints (Sunday to Saturday)
   - Past sprint tasks auto-move to backlog

4. **Session Rules**
   - Only one active session globally
   - Sessions are embedded in Task entity
   - Manual sessions can be backdated

5. **Tag Rules**
   - 'untagged' (id='untagged') is protected, cannot be deleted
   - Cannot delete a tag that has associated tasks

6. **Routine Rules**
   - Higher priority wins when multiple routines match
   - Planning mode (id='__planning__') bypasses all filters
   - Expressions evaluated with Filtrex (safe, no eval)

7. **Focus Task Selection**
   - First non-skipped task in current sprint
   - Filtered by active routine's taskFilterExpression
   - Returned skip-for-day tasks bubble to top

## Key Patterns

### CQRS (Command Query Responsibility Segregation)
- Commands: CreateTask, CompleteTask, CancelTask, SkipTask, AddSession, MoveTask
- Queries: GetTasks, GetKanbanBoard, GetFocusTask, GetStats, GetActiveRoutine

### Repository Pattern
- ITaskRepository, ITagRepository, ISprintRepository, IRoutineRepository
- Infrastructure implements with LocalStorage

### Domain Events
- TaskCreated, TaskCompleted, TaskCanceled, SessionAdded

## Testing Guidelines

```typescript
// Example test structure
describe('Task', () => {
  it('should create a task with required properties', () => {
    const task = Task.create({
      title: 'Test task',
      tagPoints: { 'tag-1': 3 }
    });
    expect(task.id).toBeDefined();
    expect(task.status).toBe('active');
  });

  it('should not allow empty title', () => {
    expect(() => Task.create({ title: '', tagPoints: {} }))
      .toThrow('Task title cannot be empty');
  });
});
```

## UI/UX Requirements

The MVP must match the POC design exactly:
- Same daisyUI components and class names
- Same color scheme and theming (dark/light)
- Same layout (drawer-end, bottom dock, FAB)
- Same Ionicons
- Same responsive breakpoints (mobile-first)
- Same animations and transitions

### Views
1. **Focus View**: Single task hero, start/done buttons, up-next preview
2. **Tasks View**: Kanban board (Backlog, This Week, Next Week)
3. **Stats View**: Today/weekly stats, tag performance, activity chart, focus quality

### Modals (11+)
- CreateTask, TaskDetail, SkipForDay, CancelTask
- CompleteSession, AddManualSession, SprintHealth, CapacityEdit
- Tags, Routines, Settings, Import

## Expression Evaluation

Routines use Filtrex for safe expression evaluation:

```javascript
// Task filter expressions
hasTag("Work")
hasAnyTag("Personal", "Health")
age > 7
inSprint

// Activation expressions
isWeekday and hour >= 9 and hour < 18
isWeekend
hour >= 18 or hour < 9
```

## Data Persistence

LocalStorage keys (POC reference):
- `checkmate_tasks`
- `checkmate_tags`
- `checkmate_sprints`
- `checkmate_routines`
- `checkmate_settings`
- `checkmate_currentView`
- `checkmate_manualRoutineId`
- `checkmate_theme`

## Import/Export

### Backup Format (JSON)
```json
{
  "version": 1,
  "exportedAt": "ISO date",
  "tasks": [],
  "tags": [],
  "sprints": [],
  "routines": [],
  "settings": {}
}
```

### Text Import Formats
- `- [ ] Task name` - Markdown checkbox
- `- Task name` - List item
- `Task name` - Plain text
- `#tagname` - Assign to tag
- `every day/week/month` - Make recurring

## References

- POC source: `./poc/index.html` (read-only reference)
- Refactoring guide: `./PROJECT.md`
- Decision log: `./DECISIONLOG.md`
- Implementation plan: `./IMPLEMENTATION_PLAN.md`
- Crossroad docs: https://crossroad.page/
- Statux docs: https://statux.dev/
- OpenRPC docs: https://open-rpc.org/
- daisyUI docs: https://daisyui.com
- Vitest docs: https://vitest.dev
- Bun docs: https://bun.sh
