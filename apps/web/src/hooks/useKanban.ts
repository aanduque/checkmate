/**
 * Kanban board data hook
 * Provides categorized task lists for the kanban view
 */

import { useStore, useSelector } from 'statux';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TaskDTO, SprintDTO, taskApi, sprintApi } from '../services/rpcClient';
import { KanbanData, ExtendedTaskDTO } from '../mocks/mockData';
import type { AppState } from '../store';

// Environment flag - set to true to use mock data for development
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export function useKanban() {
  const [sprints, setSprints] = useStore<SprintDTO[]>('sprints');
  const tasks = useSelector<TaskDTO[]>('tasks');
  const [ui, setUi] = useStore<AppState['ui']>('ui');
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    backlog: [],
    thisWeek: [],
    nextWeek: [],
    recurringTemplates: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadKanban = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_MOCKS) {
        // Import mock data dynamically
        const { mockKanbanData, mockSprints } = await import('../mocks/mockData');
        await new Promise(resolve => setTimeout(resolve, 100));
        if (sprints.length === 0) {
          setSprints(mockSprints);
        }
        setKanbanData(mockKanbanData);
      } else {
        // Load sprints first
        const [upcomingSprints, kanbanResult, templatesResult] = await Promise.all([
          sprintApi.getUpcoming(3),
          taskApi.getKanban(),
          taskApi.getRecurringTemplates()
        ]);

        setSprints(upcomingSprints);

        // Map tasks to kanban data structure
        const currentSprintId = upcomingSprints[0]?.id;
        const nextSprintId = upcomingSprints[1]?.id;

        // Convert to extended DTOs with location info
        const mapToExtended = (task: TaskDTO, location: ExtendedTaskDTO['location']): ExtendedTaskDTO => ({
          ...task,
          location
        });

        setKanbanData({
          backlog: kanbanResult.backlog.map(t => mapToExtended(t, { type: 'backlog' })),
          thisWeek: kanbanResult.sprint.map(t => mapToExtended(t, { type: 'sprint', sprintId: currentSprintId || 'sprint-0' })),
          nextWeek: [], // TODO: Get next week's tasks when API supports it
          recurringTemplates: templatesResult.templates.map(t => mapToExtended(t, { type: 'backlog' }))
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load kanban data');
    } finally {
      setLoading(false);
    }
  }, [sprints.length, setSprints]);

  // Load data on mount
  useEffect(() => {
    loadKanban();
  }, []);

  // Get current sprint
  const currentSprint = useMemo(() => {
    return sprints[0] || null;
  }, [sprints]);

  // Get next sprint
  const nextSprint = useMemo(() => {
    return sprints[1] || null;
  }, [sprints]);

  // Move task between columns
  const moveTask = useCallback(async (
    taskId: string,
    destination: string
  ) => {
    if (USE_MOCKS) {
      // Mock implementation
      setKanbanData(prev => {
        const findAndRemoveTask = () => {
          for (const column of ['backlog', 'thisWeek', 'nextWeek'] as const) {
            const index = prev[column].findIndex(t => t.id === taskId);
            if (index !== -1) {
              const task = prev[column][index];
              const newColumn = [...prev[column]];
              newColumn.splice(index, 1);
              return { task, column, newData: { ...prev, [column]: newColumn } };
            }
          }
          return null;
        };

        const result = findAndRemoveTask();
        if (!result) return prev;

        const { task, newData } = result;

        let targetColumn: keyof KanbanData;
        if (destination === 'backlog') {
          targetColumn = 'backlog';
        } else if (destination.includes('sprint-0') || destination === currentSprint?.id) {
          targetColumn = 'thisWeek';
        } else {
          targetColumn = 'nextWeek';
        }

        const updatedTask = {
          ...task,
          location: destination === 'backlog'
            ? { type: 'backlog' as const }
            : { type: 'sprint' as const, sprintId: destination }
        };

        return {
          ...newData,
          [targetColumn]: [...newData[targetColumn], updatedTask]
        };
      });
      setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
      return;
    }

    // Real API call
    try {
      const sprintId = destination === 'backlog' ? undefined : destination;
      await taskApi.move(taskId, sprintId);
      await loadKanban();
      setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move task');
      throw err;
    }
  }, [currentSprint, setUi, loadKanban]);

  // Reorder task within column
  const reorderTask = useCallback(async (
    taskId: string,
    column: string,
    newIndex: number
  ) => {
    // TODO: Implement when API supports ordering
    console.log(`Reordering task ${taskId} in ${column} to index ${newIndex}`);
  }, []);

  // Get sprint health
  const getSprintHealth = useCallback(async (sprintId: string) => {
    if (USE_MOCKS) {
      const sprintTasks = sprintId === currentSprint?.id ? kanbanData.thisWeek : kanbanData.nextWeek;
      const totalPoints = sprintTasks.reduce((sum, t) => sum + t.totalPoints, 0);
      if (totalPoints > 30) return 'off_track';
      if (totalPoints > 20) return 'at_risk';
      return 'on_track';
    }

    try {
      const health = await sprintApi.getHealth(sprintId);
      return health.overallStatus;
    } catch {
      return 'on_track';
    }
  }, [kanbanData, currentSprint]);

  // Get days remaining in sprint
  const getDaysRemaining = useCallback((sprint: SprintDTO) => {
    const endDate = new Date(sprint.endDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, []);

  return {
    kanbanData,
    loading,
    error,
    sprints,
    currentSprint,
    nextSprint,
    loadKanban,
    moveTask,
    reorderTask,
    getSprintHealth,
    getDaysRemaining
  };
}
