/**
 * Statux Store Setup
 *
 * Global state management for Check Mate app using Statux.
 * Each top-level key becomes accessible via useStore('keyname').
 */

import { TagDTO, TaskDTO, SprintDTO, FocusTaskDTO, RoutineDTO } from '../services/rpcClient';

// Re-export RoutineDTO for backwards compatibility
export type { RoutineDTO } from '../services/rpcClient';

export interface AppState {
  // Data
  tasks: TaskDTO[];
  tags: TagDTO[];
  sprints: SprintDTO[];
  routines: RoutineDTO[];
  focusTask: FocusTaskDTO | null;
  upNext: FocusTaskDTO[];

  // Settings
  settings: {
    defaultSessionDuration: number;
    theme: 'light' | 'dark';
  };

  // UI State
  ui: {
    loading: boolean;
    error: string | null;
    refreshKey: number;
    modals: {
      createTask: boolean;
      taskDetail: boolean;
      skipForDay: boolean;
      cancelTask: boolean;
      completeSession: boolean;
      addManualSession: boolean;
      sprintHealth: boolean;
      capacityEdit: boolean;
      tags: boolean;
      routines: boolean;
      settings: boolean;
      import: boolean;
    };
    selectedTask: TaskDTO | null;
    activeSession: {
      taskId: string;
      sessionId: string;
      startedAt: string; // ISO string for serialization
      durationMinutes: number;
    } | null;
    manualRoutineId: string | null; // null = auto, '__planning__' = planning mode
    drawerOpen: boolean;
    sessionElapsed: number; // seconds elapsed in current session
  };
}

export const initialState: AppState = {
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
    modals: {
      createTask: false,
      taskDetail: false,
      skipForDay: false,
      cancelTask: false,
      completeSession: false,
      addManualSession: false,
      sprintHealth: false,
      capacityEdit: false,
      tags: false,
      routines: false,
      settings: false,
      import: false
    },
    selectedTask: null,
    activeSession: null,
    manualRoutineId: null,
    drawerOpen: false,
    sessionElapsed: 0
  }
};
