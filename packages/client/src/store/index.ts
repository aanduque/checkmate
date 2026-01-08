export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'canceled';
  tagPoints: Record<string, number>;
  location: { type: 'backlog' | 'sprint'; sprintId?: string };
  createdAt: string;
  completedAt: string | null;
  canceledAt: string | null;
  skipState: {
    type: 'for_now' | 'for_day';
    skippedAt: string;
    returnAt?: string;
    justificationCommentId?: string;
    returned?: boolean;
  } | null;
  recurrence: string | null;
  parentId: string | null;
  comments: Comment[];
  sessions: Session[];
  sprintHistory: string[];
  order: number;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  skipJustification: boolean;
}

export interface Session {
  id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: string;
  endedAt: string | null;
  focusLevel: 'distracted' | 'neutral' | 'focused' | null;
  comments: Comment[];
}

export interface Tag {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  defaultCapacity: number;
}

export interface Sprint {
  id: string;
  startDate: string;
  endDate: string;
  capacityOverrides: Record<string, number>;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
  taskFilterExpression: string;
  activationExpression: string;
}

export interface ActiveSession {
  taskId: string;
  sessionId: string;
  startedAt: string;
}

export interface AppState {
  // Data
  tasks: Task[];
  tags: Tag[];
  sprints: Sprint[];
  routines: Routine[];

  // Settings
  settings: {
    defaultSessionDuration: number;
    theme: 'light' | 'dark';
  };

  // UI State
  ui: {
    currentView: 'focus' | 'tasks' | 'stats';
    selectedSprintIndex: number;
    selectedTagFilters: string[];
    manualRoutineId: string;
    activeSession: ActiveSession | null;
    sessionElapsed: number;
    modals: {
      createTask: boolean;
      createRecurring: boolean;
      taskDetail: boolean;
      skipForDay: boolean;
      completeSession: boolean;
      addManualSession: boolean;
      sprintHealth: boolean;
      capacityEdit: boolean;
      tags: boolean;
      routines: boolean;
      settings: boolean;
      import: boolean;
    };
    selectedTask: Task | null;
    selectedTaskId: string | null;
    taskToSkip: Task | null;
    capacityEditSprint: Sprint | null;
    capacityEditTag: Tag | null;
    loading: boolean;
    error: string | null;
  };
}

export const initialState: AppState = {
  tasks: [],
  tags: [],
  sprints: [],
  routines: [],
  settings: {
    defaultSessionDuration: 25,
    theme: 'light',
  },
  ui: {
    currentView: 'focus',
    selectedSprintIndex: 0,
    selectedTagFilters: [],
    manualRoutineId: '',
    activeSession: null,
    sessionElapsed: 0,
    modals: {
      createTask: false,
      createRecurring: false,
      taskDetail: false,
      skipForDay: false,
      completeSession: false,
      addManualSession: false,
      sprintHealth: false,
      capacityEdit: false,
      tags: false,
      routines: false,
      settings: false,
      import: false,
    },
    selectedTask: null,
    selectedTaskId: null,
    taskToSkip: null,
    capacityEditSprint: null,
    capacityEditTag: null,
    loading: false,
    error: null,
  },
};

// Constants
export const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;
export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
