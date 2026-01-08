/**
 * Kanban board data hook
 * Provides categorized task lists for the kanban view
 */

import { useStore, useSelector } from 'statux';
import { useCallback, useEffect, useMemo } from 'react';
import { TaskDTO, SprintDTO } from '../services/rpcClient';
import { mockKanbanData, mockSprints, mockExtendedTasks, ExtendedTaskDTO } from '../mocks/mockData';
import type { AppState } from '../store';

// Flag to use mock data
const USE_MOCKS = true;

export interface KanbanBoard {
  backlog: ExtendedTaskDTO[];
  thisWeek: ExtendedTaskDTO[];
  nextWeek: ExtendedTaskDTO[];
  recurringTemplates: ExtendedTaskDTO[];
}

export function useKanban() {
  const [sprints, setSprints] = useStore<SprintDTO[]>('sprints');
  const tasks = useSelector<TaskDTO[]>('tasks');
  const [ui, setUi] = useStore<AppState['ui']>('ui');

  // Load sprints on mount
  useEffect(() => {
    if (USE_MOCKS && sprints.length === 0) {
      setSprints(mockSprints);
    }
  }, []);

  // Get current sprint
  const currentSprint = useMemo(() => {
    return sprints[0] || null;
  }, [sprints]);

  // Get next sprint
  const nextSprint = useMemo(() => {
    return sprints[1] || null;
  }, [sprints]);

  // Board data (mocked for now)
  const board = useMemo((): KanbanBoard => {
    if (USE_MOCKS) {
      return mockKanbanData;
    }

    // When backend is ready, compute from tasks + sprints
    return {
      backlog: [],
      thisWeek: [],
      nextWeek: [],
      recurringTemplates: []
    };
  }, [tasks, sprints]);

  // Move task between columns
  const moveTask = useCallback(async (
    taskId: string,
    destination: 'backlog' | 'sprint-0' | 'sprint-1'
  ) => {
    // TODO: Call RPC when backend ready
    console.log(`Moving task ${taskId} to ${destination}`);
    setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  }, [setUi]);

  // Reorder task within column
  const reorderTask = useCallback(async (
    taskId: string,
    column: string,
    newIndex: number
  ) => {
    // TODO: Call RPC when backend ready
    console.log(`Reordering task ${taskId} in ${column} to index ${newIndex}`);
  }, []);

  // Get sprint health
  const getSprintHealth = useCallback((sprintId: string) => {
    // Simplified health calculation
    const sprintTasks = sprintId === 'sprint-0' ? board.thisWeek : board.nextWeek;
    const totalPoints = sprintTasks.reduce((sum, t) => sum + t.totalPoints, 0);

    // Simple health based on points
    if (totalPoints > 30) return 'off_track';
    if (totalPoints > 20) return 'at_risk';
    return 'on_track';
  }, [board]);

  // Get days remaining in sprint
  const getDaysRemaining = useCallback((sprint: SprintDTO) => {
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, []);

  return {
    board,
    sprints,
    currentSprint,
    nextSprint,
    moveTask,
    reorderTask,
    getSprintHealth,
    getDaysRemaining
  };
}
