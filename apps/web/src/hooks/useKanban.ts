/**
 * Kanban board data hook
 * Provides categorized task lists for the kanban view
 */

import { useStore, useSelector } from 'statux';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TaskDTO, SprintDTO } from '../services/rpcClient';
import { mockKanbanData, mockSprints, KanbanData } from '../mocks/mockData';
import type { AppState } from '../store';

// Flag to use mock data
const USE_MOCKS = true;

export function useKanban() {
  const [sprints, setSprints] = useStore<SprintDTO[]>('sprints');
  const tasks = useSelector<TaskDTO[]>('tasks');
  const [ui, setUi] = useStore<AppState['ui']>('ui');
  const [kanbanData, setKanbanData] = useState<KanbanData>(mockKanbanData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadKanban();
  }, []);

  const loadKanban = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_MOCKS) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));
        if (sprints.length === 0) {
          setSprints(mockSprints);
        }
        setKanbanData(mockKanbanData);
      } else {
        // TODO: Call RPC when backend ready
        // const data = await taskApi.getKanban();
        // setKanbanData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load kanban data');
    } finally {
      setLoading(false);
    }
  }, [sprints.length, setSprints]);

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
    // TODO: Call RPC when backend ready
    console.log(`Moving task ${taskId} to ${destination}`);

    // Update local state optimistically
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

      // Map destination to column name
      let targetColumn: keyof KanbanData;
      if (destination === 'backlog') {
        targetColumn = 'backlog';
      } else if (destination.includes('sprint-0') || destination === currentSprint?.id) {
        targetColumn = 'thisWeek';
      } else {
        targetColumn = 'nextWeek';
      }

      // Update task location
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
  }, [currentSprint, setUi]);

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
    const sprintTasks = sprintId === 'sprint-0' ? kanbanData.thisWeek : kanbanData.nextWeek;
    const totalPoints = sprintTasks.reduce((sum, t) => sum + t.totalPoints, 0);

    // Simple health based on points
    if (totalPoints > 30) return 'off_track';
    if (totalPoints > 20) return 'at_risk';
    return 'on_track';
  }, [kanbanData]);

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
