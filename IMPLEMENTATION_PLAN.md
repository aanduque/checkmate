# Check Mate MVP - Implementation Gap Analysis & Plan

## Executive Summary

This document outlines all missing features compared to the POC (`index.html`) and design specifications (`PROJECT.md`, `DESIGN.md`, `CLAUDE.md`).

---

## 1. Libraries NOT Being Used (Required by PROJECT.md)

| Library | Purpose | Current State |
|---------|---------|---------------|
| **Crossroad** | URL-based routing | Using manual `useState` |
| **Statux** | Global state management | Using component-local `useState` |
| **Ionicons** | Icon system | Using emoji placeholders |
| **RRule** | Recurrence parsing | Not implemented |
| **Filtrex** | Safe expression evaluation | Not implemented |
| **SortableJS** | Drag-and-drop | Not implemented |

---

## 2. Missing Domain Features

### 2.1 Routine Entity (NOT IMPLEMENTED)
```
Routine
├── id: string
├── name: string
├── icon: string
├── color: string
├── priority: number (1-10)
├── taskFilterExpression: string (Filtrex)
└── activationExpression: string (Filtrex)
```
- Auto-selects based on time/day
- Manual override capability
- Planning mode (show all tasks)

### 2.2 Recurring Tasks (NOT IMPLEMENTED)
- Task templates with `recurrence` RRule
- Spawn instances with `parentId` reference
- Templates shown in separate Backlog section
- Cannot be moved to sprints

### 2.3 Comments Entity (NOT IMPLEMENTED)
```
Comment
├── id: string
├── content: string
├── createdAt: Date
├── skipJustification?: boolean
└── cancelJustification?: boolean
```

### 2.4 Task Enhancements Missing
- `description` field (editable)
- `parentId` for recurring instances
- `recurrence` RRule string
- Full comments array
- Sessions with notes/comments

### 2.5 Sprint Enhancements Missing
- `capacityOverrides: Map<TagId, Points>`
- Sprint health calculation service
- 3-sprint rolling window management

---

## 3. Missing Application Layer Commands/Queries

### Commands Missing
| Command | Description |
|---------|-------------|
| `MoveTaskToSprint` | Move task from backlog to sprint |
| `MoveTaskToBacklog` | Return task to backlog |
| `UpdateTask` | Edit title, description, tags |
| `AddTaskComment` | Add comment to task |
| `DeleteTaskComment` | Remove comment |
| `AbandonSession` | End session as abandoned |
| `AddManualSession` | Create backdated session |
| `SetSprintCapacityOverride` | Override tag capacity |
| `CreateRoutine` | Create new routine |
| `UpdateRoutine` | Edit routine |
| `DeleteRoutine` | Remove routine |

### Queries Missing
| Query | Description |
|-------|-------------|
| `GetActiveRoutine` | Determine current routine |
| `GetAllRoutines` | List all routines |
| `GetSprintHealth` | Calculate sprint health |
| `GetRecurringTemplates` | List recurring tasks |

---

## 4. Missing Server RPC Methods

| Method | Status |
|--------|--------|
| `task.move` | Missing |
| `task.update` | Missing |
| `task.addComment` | Missing |
| `task.deleteComment` | Missing |
| `session.abandon` | Missing |
| `session.addManual` | Missing |
| `routine.create` | Missing |
| `routine.update` | Missing |
| `routine.delete` | Missing |
| `routine.getAll` | Missing |
| `routine.getActive` | Missing |
| `sprint.setCapacity` | Missing |
| `sprint.getHealth` | Missing |
| `data.import` | Missing |
| `data.reset` | Missing |
| `data.loadDemo` | Missing |

---

## 5. Missing Client UI Components

### 5.1 Layout Components
- [ ] **Navbar** with:
  - Logo/title
  - Active routine indicator badge
  - Theme toggle (sun/moon)
  - Drawer toggle button
- [ ] **Drawer Sidebar** with:
  - Routine selector (Auto/Planning/Manual)
  - Active routine display
  - Quick links (Tags, Routines, Settings)
  - Recently completed tasks
  - Sprint health summary
  - Dev Tools collapsible section

### 5.2 Modals Missing
| Modal | Purpose |
|-------|---------|
| TaskDetailModal | Full task editing with sessions, comments |
| AddManualSessionModal | Backdate a focus session |
| SprintHealthModal | Detailed tag health breakdown |
| CapacityEditModal | Override sprint capacity for tag |
| RoutinesModal | Full CRUD for routines |
| ImportTasksModal | Parse text to create tasks |

### 5.3 Kanban Enhancements
- [ ] Drag-and-drop with SortableJS
- [ ] Collapsible columns on mobile
- [ ] "Next Week" (Sprint 1) column
- [ ] Recurring templates section in Backlog
- [ ] Skip state badge on tasks
- [ ] Complete button on sprint task cards
- [ ] Start session button on sprint task cards
- [ ] Sprint health badge on columns

### 5.4 Focus View Enhancements
- [ ] Active session global banner (visible in all views)
- [ ] Abandon session button
- [ ] Session elapsed timer in banner
- [ ] Quick complete from banner

### 5.5 Stats View Enhancements
- [ ] Yesterday comparison arrows
- [ ] Week vs last week delta
- [ ] Weekly activity bar chart (per day)
- [ ] Focus quality radial progress
- [ ] Average session duration
- [ ] Top points tag display

### 5.6 Icon System
- [ ] Replace all emojis with Ionicons
- [ ] Consistent icon sizing

---

## 6. Missing State Management (Statux)

### Store Structure (from PROJECT.md)
```typescript
{
  tasks: [],
  tags: [],
  sprints: [],
  routines: [],
  settings: {
    defaultSessionDuration: 25,
    theme: 'light'
  },
  ui: {
    currentView: 'focus',
    manualRoutineId: '',
    activeSession: null,
    sessionElapsed: 0,
    modals: { /* 12 modal states */ },
    selectedTask: null
  }
}
```

### Hooks to Create
- `useTasks()` - Task CRUD operations
- `useKanban()` - Kanban board data
- `useFocusTask()` - Focus view data
- `useStats()` - Statistics data
- `useRoutines()` - Routine management
- `useRpc()` - JSON-RPC client wrapper

---

## 7. Implementation Plan

### Phase 1: Foundation (Library Integration)
1. Integrate Crossroad router
2. Set up Statux store with initial state
3. Create RPC client hooks
4. Add Ionicons to project

### Phase 2: Domain Completion
1. Add Routine entity + repository (TDD)
2. Add Comment value object (TDD)
3. Extend Task with description, recurrence, parentId, comments
4. Add Sprint capacityOverrides
5. Add SprintHealthCalculator service
6. Add ActiveRoutineDeterminer service

### Phase 3: Application Layer
1. Add MoveTask commands (TDD)
2. Add UpdateTask command (TDD)
3. Add Comment commands (TDD)
4. Add AbandonSession command (TDD)
5. Add AddManualSession command (TDD)
6. Add Routine commands/queries (TDD)
7. Add SprintHealth query (TDD)

### Phase 4: Server Methods
1. Register routine methods
2. Register task update/move methods
3. Register comment methods
4. Register session methods (abandon, manual)
5. Register sprint capacity methods
6. Register data management methods

### Phase 5: Client - State & Routing
1. Implement Statux store
2. Create custom hooks
3. Integrate Crossroad router
4. Refactor views to use hooks

### Phase 6: Client - Layout
1. Add Navbar component
2. Add Drawer sidebar
3. Add global active session banner
4. Update Dock with Ionicons

### Phase 7: Client - Modals
1. TaskDetailModal (full editing)
2. AddManualSessionModal
3. SprintHealthModal
4. CapacityEditModal
5. RoutinesModal
6. ImportTasksModal

### Phase 8: Client - Kanban
1. Integrate SortableJS
2. Add collapsible columns
3. Add Next Week column
4. Add recurring templates section
5. Add task action buttons

### Phase 9: Client - Views Enhancement
1. Enhance FocusView with session banner
2. Enhance StatsView with all metrics
3. Add theme toggle functionality

### Phase 10: Polish
1. Replace all emojis with Ionicons
2. Match POC styling exactly
3. Mobile responsive testing
4. Integration testing

---

## 8. Estimated Scope

| Phase | Items | Complexity |
|-------|-------|------------|
| Phase 1 | 4 | Medium |
| Phase 2 | 6 | High |
| Phase 3 | 7 | High |
| Phase 4 | 6 | Medium |
| Phase 5 | 4 | Medium |
| Phase 6 | 4 | Medium |
| Phase 7 | 6 | Medium |
| Phase 8 | 5 | High |
| Phase 9 | 3 | Medium |
| Phase 10 | 3 | Low |

**Total: ~48 major items across 10 phases**

---

## 9. Testing Strategy

All features will follow TDD (Red-Green-Refactor):
1. Domain layer tests (unit)
2. Application layer tests (integration)
3. Server method tests (integration)
4. Client component tests (React Testing Library)

Current test count: **425 tests passing**

---

## 10. Questions for Approval

Before proceeding, please confirm:

1. **Priority order** - Should I follow the phases as listed, or prioritize specific features?
2. **Crossroad/Statux** - Should we integrate these as specified, or continue with current approach?
3. **Ionicons** - Should we replace all emojis with Ionicons?
4. **Routines** - This is a major feature. Confirm it's needed for MVP?
5. **Recurring tasks** - This is complex. Confirm it's needed for MVP?
6. **Drag-drop** - SortableJS integration needed for MVP?

---

*Document generated from analysis of index.html (POC), PROJECT.md, DESIGN.md, and CLAUDE.md*
