/**
 * Statux Store Setup
 *
 * Global state management for Check Mate app
 */

import { TagDTO, TaskDTO, SprintDTO, FocusTaskDTO } from '../services/rpcClient';

export interface AppState {
  // Data
  tasks: TaskDTO[];
  tags: TagDTO[];
  sprints: SprintDTO[];
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
      tags: boolean;
      routines: boolean;
      settings: boolean;
      import: boolean;
    };
    selectedTask: TaskDTO | null;
    activeSession: {
      taskId: string;
      sessionId: string;
      startedAt: Date;
      durationMinutes: number;
    } | null;
  };
}

export const initialState: AppState = {
  tasks: [],
  tags: [],
  sprints: [],
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
      tags: false,
      routines: false,
      settings: false,
      import: false
    },
    selectedTask: null,
    activeSession: null
  }
};
