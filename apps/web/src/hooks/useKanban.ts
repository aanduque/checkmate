/**
 * Kanban board data hook
 * Provides categorized task lists for the kanban view
 */

import { useStore } from 'statux';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TaskDTO, SprintDTO, taskApi, sprintApi } from '../services/rpcClient';
import type { AppState } from '../store';

export interface ExtendedTaskDTO extends TaskDTO {
  location: { type: 'backlog' } | { type: 'sprint'; sprintId: string };
}

export interface KanbanData {
  backlog: ExtendedTaskDTO[];
  thisWeek: ExtendedTaskDTO[];
  nextWeek: ExtendedTaskDTO[];
  recurringTemplates: ExtendedTaskDTO[];
}

export function useKanban() {
  const [sprints, setSprints] = useStore<SprintDTO[]>('sprints');
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
      // Load sprints and kanban data
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load kanban data');
    } finally {
      setLoading(false);
    }
  }, [setSprints]);

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
    try {
      const sprintId = destination === 'backlog' ? undefined : destination;
      await taskApi.move(taskId, sprintId);
      await loadKanban();
      setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move task');
      throw err;
    }
  }, [setUi, loadKanban]);

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
    try {
      const health = await sprintApi.getHealth(sprintId);
      return health.overallStatus;
    } catch {
      return 'on_track';
    }
  }, []);

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
