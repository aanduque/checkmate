# Check Mate MVP Refactoring Guide

## Overview

Refactor the Check Mate POC (Proof of Concept) in `poc/index.html` into a production-ready MVP (Minimum Viable Product) using Domain-Driven Design (DDD) principles.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Package Manager | Bun |
| Monorepo | Bun Workspaces |
| Build Tool | Vite |
| Testing | Vitest (TDD: red-green-refactor) |
| Frontend | React |
| Routing | Crossroad (`crossroad` npm package) |
| State Management | Statux (`statux` npm package) |
| Styling | Tailwind CSS + daisyUI |
| Icons | Ionicons |
| Backend | JSON-RPC Server (Bun) |
| Process Runner | concurrently |

## Project Structure

```
checkmate/
├── package.json                 # Root workspace config
├── bun.lockb
├── packages/
│   ├── domain/                  # Domain layer (pure business logic)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── entities/
│   │   │   │   ├── Task.ts
│   │   │   │   ├── Tag.ts
│   │   │   │   ├── Sprint.ts
│   │   │   │   ├── Routine.ts
│   │   │   │   ├── Session.ts
│   │   │   │   └── Comment.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── TaskId.ts
│   │   │   │   ├── TagPoints.ts
│   │   │   │   ├── Location.ts
│   │   │   │   ├── SkipState.ts
│   │   │   │   ├── Recurrence.ts
│   │   │   │   └── FocusLevel.ts
│   │   │   ├── aggregates/
│   │   │   │   └── TaskAggregate.ts
│   │   │   ├── repositories/
│   │   │   │   ├── ITaskRepository.ts
│   │   │   │   ├── ITagRepository.ts
│   │   │   │   ├── ISprintRepository.ts
│   │   │   │   └── IRoutineRepository.ts
│   │   │   ├── services/
│   │   │   │   ├── TaskService.ts
│   │   │   │   ├── SprintService.ts
│   │   │   │   ├── RoutineService.ts
│   │   │   │   └── StatsService.ts
│   │   │   └── events/
│   │   │       ├── TaskCreated.ts
│   │   │       ├── TaskCompleted.ts
│   │   │       ├── TaskCanceled.ts
│   │   │       └── SessionAdded.ts
│   │   └── tests/
│   │       ├── entities/
│   │       ├── services/
│   │       └── aggregates/
│   │
│   ├── application/             # Application layer (use cases)
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── commands/
│   │   │   │   ├── CreateTaskCommand.ts
│   │   │   │   ├── CompleteTaskCommand.ts
│   │   │   │   ├── CancelTaskCommand.ts
│   │   │   │   ├── AddSessionCommand.ts
│   │   │   │   ├── SkipTaskCommand.ts
│   │   │   │   ├── MoveTaskCommand.ts
│   │   │   │   ├── ImportTasksCommand.ts
│   │   │   │   └── ExportDataCommand.ts
│   │   │   ├── queries/
│   │   │   │   ├── GetTasksQuery.ts
│   │   │   │   ├── GetKanbanBoardQuery.ts
│   │   │   │   ├── GetFocusTaskQuery.ts
│   │   │   │   ├── GetStatsQuery.ts
│   │   │   │   └── GetActiveRoutineQuery.ts
│   │   │   └── handlers/
│   │   │       ├── CommandHandler.ts
│   │   │       └── QueryHandler.ts
│   │   └── tests/
│   │
│   ├── infrastructure/          # Infrastructure layer
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── persistence/
│   │   │   │   ├── LocalStorageTaskRepository.ts
│   │   │   │   ├── LocalStorageTagRepository.ts
│   │   │   │   ├── LocalStorageSprintRepository.ts
│   │   │   │   └── LocalStorageRoutineRepository.ts
│   │   │   ├── services/
│   │   │   │   ├── RecurrenceParser.ts      # Uses rrule
│   │   │   │   └── FilterExpressionEvaluator.ts  # Uses filtrex
│   │   │   └── export/
│   │   │       ├── JsonExporter.ts
│   │   │       └── JsonImporter.ts
│   │   └── tests/
│   │
│   ├── server/                  # JSON-RPC Server
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts         # Server entry point
│   │   │   ├── rpc/
│   │   │   │   ├── RpcServer.ts
│   │   │   │   ├── methods/
│   │   │   │   │   ├── taskMethods.ts
│   │   │   │   │   ├── tagMethods.ts
│   │   │   │   │   ├── sprintMethods.ts
│   │   │   │   │   ├── routineMethods.ts
│   │   │   │   │   └── statsMethods.ts
│   │   │   │   └── types.ts
│   │   │   └── middleware/
│   │   │       └── errorHandler.ts
│   │   └── tests/
│   │
│   └── client/                  # React Frontend
│       ├── package.json
│       ├── vite.config.ts
│       ├── index.html
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── store/
│       │   │   ├── index.ts     # Statux store setup
│       │   │   ├── taskStore.ts
│       │   │   ├── tagStore.ts
│       │   │   ├── sprintStore.ts
│       │   │   ├── routineStore.ts
│       │   │   └── uiStore.ts
│       │   ├── hooks/
│       │   │   ├── useTasks.ts
│       │   │   ├── useKanban.ts
│       │   │   ├── useFocusTask.ts
│       │   │   ├── useStats.ts
│       │   │   ├── useRoutines.ts
│       │   │   └── useRpc.ts    # JSON-RPC client hook
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Dock.tsx
│       │   │   │   ├── Drawer.tsx
│       │   │   │   ├── Header.tsx
│       │   │   │   └── FAB.tsx
│       │   │   ├── views/
│       │   │   │   ├── FocusView.tsx
│       │   │   │   ├── TasksView.tsx
│       │   │   │   └── StatsView.tsx
│       │   │   ├── kanban/
│       │   │   │   ├── KanbanBoard.tsx
│       │   │   │   ├── KanbanColumn.tsx
│       │   │   │   └── TaskCard.tsx
│       │   │   ├── tasks/
│       │   │   │   ├── TaskDetailModal.tsx
│       │   │   │   ├── CreateTaskModal.tsx
│       │   │   │   ├── TagBadge.tsx
│       │   │   │   └── SessionList.tsx
│       │   │   ├── stats/
│       │   │   │   ├── StatsRow.tsx
│       │   │   │   ├── TagPerformance.tsx
│       │   │   │   ├── WeeklyActivity.tsx
│       │   │   │   └── FocusQuality.tsx
│       │   │   ├── modals/
│       │   │   │   ├── SkipForDayModal.tsx
│       │   │   │   ├── CancelTaskModal.tsx
│       │   │   │   ├── CompleteSessionModal.tsx
│       │   │   │   ├── AddManualSessionModal.tsx
│       │   │   │   ├── ImportTasksModal.tsx
│       │   │   │   ├── TagsModal.tsx
│       │   │   │   ├── RoutinesModal.tsx
│       │   │   │   └── SettingsModal.tsx
│       │   │   └── common/
│       │   │       ├── Modal.tsx
│       │   │       ├── Button.tsx
│       │   │       └── Input.tsx
│       │   ├── services/
│       │   │   └── rpcClient.ts  # JSON-RPC client
│       │   └── utils/
│       │       ├── dateUtils.ts
│       │       └── formatters.ts
│       └── tests/
│           ├── components/
│           └── hooks/
```

## Root package.json

```json
{
  "name": "checkmate",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"bun run dev:server\" \"bun run dev:client\"",
    "dev:server": "bun run --filter @checkmate/server dev",
    "dev:client": "bun run --filter @checkmate/client dev",
    "build": "bun run --filter '*' build",
    "test": "bun run --filter '*' test",
    "test:watch": "bun run --filter '*' test:watch",
    "lint": "bun run --filter '*' lint"
  },
  "devDependencies": {
    "concurrently": "^8.2.0",
    "typescript": "^5.3.0"
  }
}
```

## Development Methodology: TDD (Red-Green-Refactor)

### Workflow

1. **RED**: Write a failing test first
2. **GREEN**: Write minimal code to make the test pass
3. **REFACTOR**: Improve code while keeping tests green

### Example TDD Cycle

```typescript
// 1. RED - Write failing test first
// packages/domain/tests/entities/Task.test.ts
import { describe, it, expect } from 'vitest';
import { Task } from '../../src/entities/Task';

describe('Task', () => {
  it('should create a task with required properties', () => {
    const task = Task.create({
      title: 'Test task',
      tagPoints: { 'tag-1': 3 }
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe('Test task');
    expect(task.status).toBe('active');
    expect(task.tagPoints).toEqual({ 'tag-1': 3 });
  });

  it('should not allow empty title', () => {
    expect(() => Task.create({ title: '', tagPoints: {} }))
      .toThrow('Task title cannot be empty');
  });

  it('should require at least one tag', () => {
    expect(() => Task.create({ title: 'Test', tagPoints: {} }))
      .toThrow('Task must have at least one tag');
  });
});

// 2. GREEN - Implement minimal code
// packages/domain/src/entities/Task.ts
export class Task {
  readonly id: string;
  readonly title: string;
  readonly status: 'active' | 'completed' | 'canceled';
  readonly tagPoints: Record<string, number>;

  private constructor(props: TaskProps) {
    this.id = props.id;
    this.title = props.title;
    this.status = props.status;
    this.tagPoints = props.tagPoints;
  }

  static create(props: CreateTaskProps): Task {
    if (!props.title?.trim()) {
      throw new Error('Task title cannot be empty');
    }
    if (Object.keys(props.tagPoints).length === 0) {
      throw new Error('Task must have at least one tag');
    }

    return new Task({
      id: crypto.randomUUID(),
      title: props.title.trim(),
      status: 'active',
      tagPoints: props.tagPoints,
    });
  }
}

// 3. REFACTOR - Improve while tests stay green
```

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests for specific package
bun run --filter @checkmate/domain test

# Run tests with coverage
bun test --coverage
```

## Crossroad Router Usage

```tsx
// packages/client/src/App.tsx
import Router, { Switch, Route } from 'crossroad';
import { Store } from 'statux';
import { FocusView } from './components/views/FocusView';
import { TasksView } from './components/views/TasksView';
import { StatsView } from './components/views/StatsView';
import { Dock } from './components/layout/Dock';
import { Drawer } from './components/layout/Drawer';
import { initialState } from './store';

export function App() {
  return (
    <Store state={initialState}>
      <Router>
        <div className="drawer drawer-end">
          <input id="main-drawer" type="checkbox" className="drawer-toggle" />

          <div className="drawer-content flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 pb-20">
              <Switch redirect="/focus">
                <Route path="/focus" component={FocusView} />
                <Route path="/tasks" component={TasksView} />
                <Route path="/stats" component={StatsView} />
              </Switch>
            </main>

            <Dock />
          </div>

          <Drawer />
        </div>
      </Router>
    </Store>
  );
}
```

## Statux State Management

```tsx
// packages/client/src/store/index.ts
import { Store } from 'statux';

export const initialState = {
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
    modals: {
      createTask: false,
      taskDetail: false,
      skipForDay: false,
      cancelTask: false,
      completeSession: false,
      addManualSession: false,
      tags: false,
      routines: false,
      settings: false,
      import: false
    },
    selectedTask: null
  }
};

// packages/client/src/hooks/useTasks.ts
import { useStore } from 'statux';

export function useTasks() {
  const [tasks, setTasks] = useStore('tasks');

  const addTask = (task) => {
    setTasks((prev) => [...prev, task]);
  };

  const updateTask = (taskId, updates) => {
    setTasks((prev) =>
      prev.map(t => t.id === taskId ? { ...t, ...updates } : t)
    );
  };

  const completeTask = (taskId) => {
    updateTask(taskId, {
      status: 'completed',
      completedAt: new Date().toISOString()
    });
  };

  return { tasks, addTask, updateTask, completeTask };
}

// packages/client/src/components/tasks/TaskCard.tsx
import { useStore } from 'statux';

export function TaskCard({ task }) {
  const [, setSelectedTask] = useStore('ui.selectedTask');
  const [, setModalOpen] = useStore('ui.modals.taskDetail');

  const openDetail = () => {
    setSelectedTask(task);
    setModalOpen(true);
  };

  return (
    <div
      className="kanban-task bg-base-100 rounded-lg p-3 shadow-sm border-l-4"
      style={{ borderLeftColor: task.primaryTagColor }}
      onClick={openDetail}
    >
      <p className="font-medium text-sm truncate">{task.title}</p>
      {/* ... */}
    </div>
  );
}
```

## JSON-RPC Server

```typescript
// packages/server/src/rpc/RpcServer.ts
import { serve } from 'bun';

interface RpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: unknown;
  id: string | number;
}

interface RpcResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
  id: string | number;
}

export class RpcServer {
  private methods: Map<string, (params: unknown) => Promise<unknown>> = new Map();

  register(name: string, handler: (params: unknown) => Promise<unknown>) {
    this.methods.set(name, handler);
  }

  async handle(request: RpcRequest): Promise<RpcResponse> {
    const method = this.methods.get(request.method);

    if (!method) {
      return {
        jsonrpc: '2.0',
        error: { code: -32601, message: 'Method not found' },
        id: request.id
      };
    }

    try {
      const result = await method(request.params);
      return { jsonrpc: '2.0', result, id: request.id };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        error: { code: -32000, message: error.message },
        id: request.id
      };
    }
  }

  start(port: number) {
    serve({
      port,
      fetch: async (req) => {
        if (req.method === 'POST') {
          const body = await req.json() as RpcRequest;
          const response = await this.handle(body);
          return new Response(JSON.stringify(response), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return new Response('Method not allowed', { status: 405 });
      }
    });

    console.log(`JSON-RPC server running on port ${port}`);
  }
}

// packages/server/src/rpc/methods/taskMethods.ts
export function registerTaskMethods(server: RpcServer, taskService: TaskService) {
  server.register('task.create', async (params) => {
    return taskService.createTask(params as CreateTaskParams);
  });

  server.register('task.complete', async (params) => {
    return taskService.completeTask((params as { id: string }).id);
  });

  server.register('task.cancel', async (params) => {
    const { id, justification } = params as { id: string; justification: string };
    return taskService.cancelTask(id, justification);
  });

  server.register('task.getAll', async () => {
    return taskService.getAllTasks();
  });

  server.register('task.getKanban', async () => {
    return taskService.getKanbanBoard();
  });
}
```

## Key Features to Implement

All features from the POC must work exactly the same:

### Task Management
- [ ] Create tasks with title, description, tags, and points
- [ ] Complete tasks
- [ ] Cancel tasks with required justification
- [ ] Skip tasks for now
- [ ] Skip tasks for day with justification
- [ ] Edit task tags (add/remove)
- [ ] Move tasks between backlog and sprints
- [ ] Drag-and-drop reordering in Kanban

### Focus Sessions
- [ ] Start live focus session with timer
- [ ] Complete session with focus level rating
- [ ] Abandon session
- [ ] Add manual sessions (duration, date, focus level, note)

### Kanban Board
- [ ] Backlog column
- [ ] This Week (Sprint 0) column
- [ ] Next Week (Sprint 1) column
- [ ] Recurring templates section in Backlog
- [ ] Collapsible columns on mobile

### Stats & Insights
- [ ] Today's progress (tasks, points, focus time)
- [ ] Weekly summary with comparison
- [ ] Current streak
- [ ] Tag performance progress bars
- [ ] Weekly activity chart
- [ ] Focus quality radial progress

### Routines
- [ ] Auto-select routine based on time
- [ ] Manual routine override
- [ ] Planning mode (show all tasks)
- [ ] Task filtering by routine expression

### Data Management
- [ ] Export backup (JSON)
- [ ] Import backup
- [ ] Import tasks from text (markdown/plain)
- [ ] Reset all data
- [ ] Load demo data

### UI/UX
- [ ] Dark/light theme toggle
- [ ] Bottom dock navigation
- [ ] Drawer sidebar menu
- [ ] FAB for quick task creation
- [ ] All modals match POC design
- [ ] Responsive design (mobile-first)

## Design Requirements

The MVP must match the POC design exactly:

- Use daisyUI components with same class names
- Same color scheme and theming
- Same layout structure (drawer, dock, FAB)
- Same Ionicons
- Same responsive breakpoints
- Same animations and transitions

## Getting Started

```bash
# Initialize the monorepo
mkdir checkmate-mvp && cd checkmate-mvp
bun init

# Create workspace structure
mkdir -p packages/{domain,application,infrastructure,server,client}

# Install root dependencies
bun add -d concurrently typescript

# Initialize each package
cd packages/domain && bun init
cd ../application && bun init
cd ../infrastructure && bun init
cd ../server && bun init
cd ../client && bun create vite . --template react-ts

# Install shared dependencies
bun add -w vitest @types/node

# Start development
bun dev
```

## References

- POC source: `./poc/index.html`
- Crossroad docs: https://github.com/franciscop/crossroad
- Statux docs: https://github.com/franciscop/statux
- daisyUI docs: https://daisyui.com
- Vitest docs: https://vitest.dev
- Bun docs: https://bun.sh

