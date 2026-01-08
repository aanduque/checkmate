# Check Mate MVP - Implementation Gap Analysis & Plan

## Executive Summary

This document outlines all missing features compared to the POC (`index.html`) and design specifications (`PROJECT.md`, `DESIGN.md`, `CLAUDE.md`).

**Key Decisions Made (see DECISIONLOG.md):**
- DEC-021: Crossroad for client-side routing
- DEC-022: Statux for global state management
- DEC-023: OpenRPC for API schema and type generation
- DEC-024: Hexagonal architecture for external libraries (ports/adapters)

---

## 1. Library Integration Status

| Library | Purpose | Status | Architecture Layer |
|---------|---------|--------|-------------------|
| **Crossroad** | URL-based routing | ✅ Integrated in main.tsx | Client infrastructure |
| **Statux** | Global state management | ✅ Integrated in main.tsx | Client infrastructure |
| **OpenRPC** | API schema + types | 🔲 Pending | Server infrastructure (packages/shared) |
| **Ionicons** | Icon system | 🔲 Using emoji placeholders | Client infrastructure |
| **RRule** | Recurrence parsing | 🔲 In deps, needs adapter | Port/Adapter pattern |
| **Filtrex** | Safe expression evaluation | 🔲 In deps, needs adapter | Port/Adapter pattern |
| **SortableJS** | Drag-and-drop | 🔲 Not implemented | Client infrastructure |

### 1.1 Port/Adapter Architecture (DEC-024)

External libraries are isolated behind domain ports:

```
packages/domain/src/ports/
├── IFilterExpressionEvaluator.ts   # Interface for expression evaluation
├── IRecurrenceCalculator.ts        # Interface for recurrence calculation

packages/infrastructure/src/adapters/
├── FiltrexExpressionEvaluator.ts   # Filtrex implementation
├── RRuleRecurrenceCalculator.ts    # RRule implementation
```

**Rationale:** Domain layer has zero runtime dependencies on external libs. Tests use simple mocks.

### 1.2 OpenRPC Integration (DEC-023)

```
packages/shared/
├── openrpc.yaml                    # API schema (source of truth)
├── openrpc.json                    # Generated from YAML
├── generated/
│   └── types.ts                    # Auto-generated TypeScript types
├── package.json

Build pipeline:
  yaml → json → typescript types

Server: @open-rpc/server-js with method mapping
Client: imports types from @checkmate/shared
```

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
├── taskFilterExpression: string (via IFilterExpressionEvaluator port)
└── activationExpression: string (via IFilterExpressionEvaluator port)
```
- Auto-selects based on time/day
- Manual override capability
- Planning mode (show all tasks)

### 2.2 Recurring Tasks (NOT IMPLEMENTED)
- Task templates with `recurrence` RRule (via IRecurrenceCalculator port)
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

Will be defined in `packages/shared/openrpc.yaml`:

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

## 6. State Management (Statux) - ✅ INTEGRATED

### Store Structure (defined in packages/client/src/store/index.ts)
```typescript
{
  tasks: [],
  tags: [],
  sprints: [],
  routines: [],
  focusTask: null,
  upNext: [],
  settings: {
    defaultSessionDuration: 25,
    theme: 'light'
  },
  ui: {
    loading: false,
    error: null,
    refreshKey: 0,
    modals: { /* modal states */ },
    selectedTask: null,
    activeSession: null
  }
}
```

### Hooks to Create
- `useTasks()` - Task CRUD operations
- `useKanban()` - Kanban board data
- `useFocusTask()` - Focus view data
- `useStats()` - Statistics data
- `useRoutines()` - Routine management

---

## 7. Implementation Plan (Revised)

### Phase 1: OpenRPC + Shared Types
1. Create `packages/shared` workspace
2. Write `openrpc.yaml` schema for existing methods
3. Set up YAML → JSON → TypeScript build pipeline
4. Migrate server to `@open-rpc/server-js`
5. Update client to import types from shared

### Phase 2: Domain Ports & Adapters
1. Define `IFilterExpressionEvaluator` port
2. Define `IRecurrenceCalculator` port
3. Implement `FiltrexExpressionEvaluator` adapter (TDD)
4. Implement `RRuleRecurrenceCalculator` adapter (TDD)

### Phase 3: Domain Completion
1. Add Routine entity + repository (TDD)
2. Add Comment value object (TDD)
3. Extend Task with description, recurrence, parentId, comments
4. Add Sprint capacityOverrides
5. Add SprintHealthCalculator service
6. Add ActiveRoutineDeterminer service

### Phase 4: Application Layer
1. Add MoveTask commands (TDD)
2. Add UpdateTask command (TDD)
3. Add Comment commands (TDD)
4. Add AbandonSession command (TDD)
5. Add AddManualSession command (TDD)
6. Add Routine commands/queries (TDD)
7. Add SprintHealth query (TDD)

### Phase 5: Server Methods
1. Add new methods to OpenRPC schema
2. Generate updated types
3. Register routine methods
4. Register task update/move methods
5. Register comment methods
6. Register session methods (abandon, manual)
7. Register sprint capacity methods
8. Register data management methods

### Phase 6: Client - Routing & State Hooks
1. ✅ Crossroad router integrated
2. ✅ Statux store integrated
3. Update App.tsx to use Route components
4. Update Dock to use anchor navigation
5. Create custom hooks (useTasks, useKanban, etc.)
6. Refactor views to use hooks

### Phase 7: Client - Layout
1. Add Navbar component
2. Add Drawer sidebar
3. Add global active session banner
4. Update Dock with Ionicons

### Phase 8: Client - Modals
1. TaskDetailModal (full editing)
2. AddManualSessionModal
3. SprintHealthModal
4. CapacityEditModal
5. RoutinesModal
6. ImportTasksModal

### Phase 9: Client - Kanban
1. Integrate SortableJS
2. Add collapsible columns
3. Add Next Week column
4. Add recurring templates section
5. Add task action buttons

### Phase 10: Client - Views Enhancement
1. Enhance FocusView with session banner
2. Enhance StatsView with all metrics
3. Add theme toggle functionality

### Phase 11: Polish
1. Replace all emojis with Ionicons
2. Match POC styling exactly
3. Mobile responsive testing
4. Integration testing

---

## 8. Estimated Scope

| Phase | Items | Complexity |
|-------|-------|------------|
| Phase 1 (OpenRPC) | 5 | Medium |
| Phase 2 (Ports/Adapters) | 4 | Medium |
| Phase 3 (Domain) | 6 | High |
| Phase 4 (Application) | 7 | High |
| Phase 5 (Server) | 8 | Medium |
| Phase 6 (Client Routing) | 6 | Medium |
| Phase 7 (Layout) | 4 | Medium |
| Phase 8 (Modals) | 6 | Medium |
| Phase 9 (Kanban) | 5 | High |
| Phase 10 (Views) | 3 | Medium |
| Phase 11 (Polish) | 4 | Low |

**Total: ~58 major items across 11 phases**

---

## 9. Testing Strategy

All features will follow TDD (Red-Green-Refactor):
1. Domain layer tests (unit)
2. Port adapter tests (integration)
3. Application layer tests (integration)
4. Server method tests (integration)
5. Client component tests (React Testing Library)

Current test count: **425 tests passing**

---

## 10. Decisions Made

All questions from original plan have been resolved:

| Question | Decision |
|----------|----------|
| Crossroad/Statux? | ✅ Yes, integrated (DEC-021, DEC-022) |
| OpenRPC? | ✅ Yes, with YAML schema (DEC-023) |
| Hex architecture for libs? | ✅ Yes, ports/adapters (DEC-024) |
| Ionicons? | Yes, replace emojis |
| Routines? | Yes, needed for MVP |
| Recurring tasks? | Yes, needed for MVP |
| Drag-drop? | Yes, SortableJS needed |

---

*Document updated: 2025-01-08*
*See DECISIONLOG.md for detailed decision rationale*
