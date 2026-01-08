import { useStore } from 'statux';
import { useCallback, useMemo } from 'react';
import { api } from '../services/rpcClient';
import type { Routine, Task, Tag } from '../store';

export function useRoutines() {
  const [routines, setRoutines] = useStore<Routine[]>('routines');
  const [tags] = useStore<Tag[]>('tags');
  const [manualRoutineId, setManualRoutineId] = useStore<string>(
    'ui.manualRoutineId'
  );

  const refreshRoutines = useCallback(async () => {
    const result = await api.routines.getAll();
    setRoutines(result.routines);
  }, [setRoutines]);

  const createRoutine = useCallback(
    async (params: {
      name: string;
      icon: string;
      color: string;
      priority?: number;
      filter?: string;
      timeRanges?: Array<{ start: string; end: string }>;
    }) => {
      // Convert to API format
      const apiParams = {
        name: params.name,
        icon: params.icon,
        color: params.color,
        priority: params.priority,
        taskFilterExpression: params.filter || '',
        activationExpression: params.timeRanges
          ? params.timeRanges
              .map((r) => `(time >= "${r.start}" and time < "${r.end}")`)
              .join(' or ')
          : '',
      };
      const result = await api.routines.create(apiParams);
      setRoutines((prev: Routine[]) => [...prev, result.routine]);
      return result.routine;
    },
    [setRoutines]
  );

  const updateRoutine = useCallback(
    async (
      routineId: string,
      params: {
        name?: string;
        icon?: string;
        color?: string;
        priority?: number;
        filter?: string;
        timeRanges?: Array<{ start: string; end: string }>;
      }
    ) => {
      // Convert to API format
      const apiParams: any = {
        routineId,
        name: params.name,
        icon: params.icon,
        color: params.color,
        priority: params.priority,
      };
      if (params.filter !== undefined) {
        apiParams.taskFilterExpression = params.filter;
      }
      if (params.timeRanges !== undefined) {
        apiParams.activationExpression = params.timeRanges.length > 0
          ? params.timeRanges
              .map((r) => `(time >= "${r.start}" and time < "${r.end}")`)
              .join(' or ')
          : '';
      }
      const result = await api.routines.update(apiParams);
      setRoutines((prev: Routine[]) =>
        prev.map((r) => (r.id === routineId ? result.routine : r))
      );
      return result.routine;
    },
    [setRoutines]
  );

  const deleteRoutine = useCallback(
    async (routineId: string) => {
      await api.routines.delete(routineId);
      setRoutines((prev: Routine[]) => prev.filter((r) => r.id !== routineId));
    },
    [setRoutines]
  );

  // Determine active routine based on time of day or manual selection
  const activeRoutine = useMemo(() => {
    if (manualRoutineId) {
      return routines.find((r) => r.id === manualRoutineId) || null;
    }

    // Check time-based routines
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    // Find routine that matches current time
    // Note: In production, this should use proper expression evaluation
    // For now, we parse simple time ranges from activationExpression
    for (const routine of routines) {
      if (!routine.activationExpression) continue;

      // Simple parsing of time ranges like: (time >= "09:00" and time < "12:00")
      const timeMatches = routine.activationExpression.match(
        /time >= "(\d{2}:\d{2})" and time < "(\d{2}:\d{2})"/g
      );
      if (timeMatches) {
        for (const match of timeMatches) {
          const parsed = match.match(/time >= "(\d{2}:\d{2})" and time < "(\d{2}:\d{2})"/);
          if (parsed) {
            const [, start, end] = parsed;
            if (currentTime >= start && currentTime < end) {
              return routine;
            }
          }
        }
      }
    }

    return null;
  }, [routines, manualRoutineId]);

  // Filter tasks based on routine's filter expression
  const getFilteredTasks = useCallback(
    (tasks: Task[]) => {
      if (!activeRoutine || !activeRoutine.taskFilterExpression) {
        return tasks;
      }

      const filter = activeRoutine.taskFilterExpression;

      // Simple filter parsing for common patterns
      // In production, this should use Filtrex or similar expression evaluator
      return tasks.filter((task) => {
        // Handle "tagName" in tags pattern
        const tagNameMatch = filter.match(/"([^"]+)"\s+in\s+tags/);
        if (tagNameMatch) {
          const tagName = tagNameMatch[1];
          const tag = tags.find((t) => t.name === tagName);
          if (tag && task.tagPoints && task.tagPoints[tag.id]) {
            return true;
          }
        }

        // Handle points > N pattern
        const pointsMatch = filter.match(/points\s*>\s*(\d+)/);
        if (pointsMatch) {
          const minPoints = parseInt(pointsMatch[1]);
          const totalPoints = Object.values(task.tagPoints || {}).reduce(
            (sum, p) => sum + p,
            0
          );
          if (totalPoints > minPoints) {
            return true;
          }
        }

        // If no specific filters matched, include all
        if (!tagNameMatch && !pointsMatch) {
          return true;
        }

        return false;
      });
    },
    [activeRoutine, tags]
  );

  const clearRoutineOverride = useCallback(() => {
    setManualRoutineId('');
  }, [setManualRoutineId]);

  return {
    routines,
    activeRoutine,
    manualRoutineId,
    refreshRoutines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    setManualRoutineId,
    clearRoutineOverride,
    getFilteredTasks,
  };
}
