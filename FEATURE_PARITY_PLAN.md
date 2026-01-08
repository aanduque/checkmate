# Check Mate Feature Parity Plan (TDD Approach)

## Current State Analysis

### What's Implemented (Domain Layer)
- Task entity with basic CRUD, status management, skip states, sessions, comments
- Sprint entity with capacity overrides and health calculations
- Tag entity with name, icon, color, defaultCapacity
- Routine entity with filter/activation expressions
- Session entity with status, focus level, notes
- SprintHealthService for health calculations
- Basic value objects (TaskId, TagPoints, Location, SkipState, etc.)

### What's Implemented (Application Layer)
- Commands: Create/Complete/Cancel Task, Move Task, Skip Task, Session management
- Queries: Get Tasks, Backlog, Templates, Completed, Sprints, Tags, Routines, Stats

### What's Implemented (Client Layer)
- Views: FocusView, TasksView (Kanban), StatsView
- Modals: CreateTask, TaskDetail, SkipForDay, CompleteSession, Tags, Routines, Settings, Import
- Layout: Header, Dock, Drawer, SessionBanner
- Hooks: useTasks, useSprints, useTags, useRoutines, useSessions

---

## Feature Gaps Identified

### HIGH PRIORITY - Core Functionality Gaps

1. **Task Update Operations** (Missing)
   - `task.update` - Update title, description
   - `task.updateTagPoints` - Add/remove tags from tasks
   - `task.addComment` / `task.deleteComment` - Comment management via RPC

2. **Manual Session Addition** (Missing)
   - Add focus sessions retroactively with custom duration, date, focus level

3. **Cancel Task with Justification** (Partial)
   - Cancel justification comment (distinct from skip justification)
   - Cancel stats tracking

4. **Export/Import Full Backup** (Partial - Import exists for text, not JSON)
   - Full JSON export of all data (tasks, tags, sprints, routines, settings)
   - Full JSON import to restore backup

5. **Routine Task Filtering** (Missing infrastructure)
   - FilterExpressionEvaluator needs `hasTag()`, `hasAnyTag()`, `hasAllTags()` functions
   - Task context variables: age, sprintCount, points, inBacklog, inSprint

6. **Routine Activation** (Missing)
   - Auto-detect active routine by activation expression
   - Time-based variables: hour, minute, dayOfWeek, isWeekday, isWeekend

### MEDIUM PRIORITY - Statistics & Metrics

7. **Comprehensive Stats** (Partial)
   - Weekly comparison (this week vs last week)
   - Completion streak tracking
   - Focus quality distribution (% focused/neutral/distracted)
   - Daily activity patterns
   - Per-tag weekly point totals

8. **Sprint Archive** (Missing)
   - Auto-archive past sprints
   - Move completed tasks from archived sprints to backlog

### MEDIUM PRIORITY - UI/UX Features

9. **LocalStorage Persistence** (Missing for client)
   - Persist currentView to localStorage
   - Persist manualRoutineId to localStorage
   - Persist theme preference

10. **Skip Return System** (Partial)
    - Auto-return check on app load
    - Visual indicators for returned tasks

11. **Recurring Task Management** (Partial)
    - Display next occurrence date
    - Instance spawning from templates

### LOWER PRIORITY - Polish

12. **Demo Data Loading**
13. **Theme Toggle** (dark mode implementation)
14. **Help System / Feature Explanations**

---

## TDD Implementation Plan

### Phase 1: Domain Layer Tests & Fixes

#### 1.1 Task Update Tests
```
tests/entities/Task.update.test.ts
- should update task title when active
- should update task description when active
- should throw when updating completed task
- should update tag points (add/remove tags)
```

#### 1.2 Cancel with Justification Tests
```
tests/entities/Task.cancel.test.ts
- should cancel with justification comment
- should mark comment as cancelJustification
- should track canceledAt timestamp
```

#### 1.3 Manual Session Tests
```
tests/entities/Task.manualSession.test.ts
- should add manual session with custom duration
- should add manual session with specific date
- should validate duration range (1-480 minutes)
```

#### 1.4 Statistics Service Tests
```
tests/services/StatsService.test.ts
- should calculate weekly points by tag
- should compare this week vs last week
- should calculate completion streak
- should calculate focus quality distribution
- should calculate daily activity patterns
```

### Phase 2: Infrastructure Layer

#### 2.1 Filter Expression Evaluator Tests
```
tests/services/FilterExpressionEvaluator.test.ts
- should evaluate hasTag("Work") correctly
- should evaluate hasAnyTag("Work", "Personal")
- should evaluate hasAllTags("Work", "Important")
- should provide task context (age, points, location)
```

#### 2.2 Routine Activation Evaluator Tests
```
tests/services/ActivationExpressionEvaluator.test.ts
- should evaluate time-based expressions
- should provide hour, minute, dayOfWeek variables
- should provide isWeekday, isWeekend booleans
```

#### 2.3 JSON Export/Import Tests
```
tests/export/JsonExporter.test.ts
- should export all tasks with sessions and comments
- should export all tags, sprints, routines
- should include timestamp
tests/export/JsonImporter.test.ts
- should import and restore full state
- should validate JSON structure
```

### Phase 3: Application Layer Commands

#### 3.1 New Commands
```
- UpdateTaskCommand (title, description)
- UpdateTaskTagPointsCommand
- AddCommentCommand / DeleteCommentCommand
- CancelTaskWithJustificationCommand
- AddManualSessionCommand
- ExportDataQuery
- ImportDataCommand
```

### Phase 4: Server RPC Methods

#### 4.1 New Task Methods
```
task.update - Update task properties
task.updateTagPoints - Modify tag assignments
task.addComment - Add comment to task
task.deleteComment - Remove comment from task
task.addManualSession - Add retroactive session
```

#### 4.2 New Export/Import Methods
```
data.export - Full JSON export
data.import - Full JSON import
```

### Phase 5: Client Implementation

#### 5.1 Hook Updates
- useTasks: Add update, updateTagPoints, addComment, deleteComment, addManualSession
- useRoutines: Add active routine detection, getFilteredTasks
- useStats: Add weekly comparison, streak, focus distribution

#### 5.2 New Components
- AddManualSessionModal
- CancelTaskModal (with justification)
- ExportButton / ImportBackupModal

#### 5.3 Store Updates
- Add localStorage persistence for currentView, manualRoutineId, theme
- Add stats state (weeklyComparison, streak, focusDistribution)

#### 5.4 View Updates
- StatsView: Add weekly comparison, activity chart, focus distribution
- TaskDetailModal: Add cancel with justification, manual session add
- SettingsModal: Add export/import buttons

---

## Test Coverage Targets

| Package | Current Tests | Target Tests |
|---------|--------------|--------------|
| domain | 37 | 80+ |
| application | 0 | 30+ |
| infrastructure | 0 | 20+ |
| client | 0 | 15+ (component tests) |

---

## Execution Order (Recommended)

1. **Week 1: Domain & Infrastructure Tests**
   - Task update tests + implementation
   - Cancel with justification tests + implementation
   - Manual session tests + implementation
   - Stats service tests + implementation
   - Filter expression tests + implementation

2. **Week 2: Application & Server**
   - New commands + tests
   - New RPC methods
   - Export/Import implementation

3. **Week 3: Client Integration**
   - Hook updates
   - New modals
   - LocalStorage persistence
   - View updates

4. **Week 4: Polish & Testing**
   - E2E testing
   - Bug fixes
   - Demo data
   - Documentation

---

## Approval Checklist

- [ ] Phase 1: Domain Layer (TDD)
- [ ] Phase 2: Infrastructure Layer (TDD)
- [ ] Phase 3: Application Layer (TDD)
- [ ] Phase 4: Server RPC Methods
- [ ] Phase 5: Client Implementation

Note: All behavior matches the reference POC (index.html) exactly.
