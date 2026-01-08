import { useStore } from 'statux';
import { useCallback } from 'react';
import { api } from '../services/rpcClient';
import type { Sprint, Tag, Task } from '../store';

export function useSprints() {
  const [sprints, setSprints] = useStore<Sprint[]>('sprints');
  const [selectedSprintIndex] = useStore<number>('ui.selectedSprintIndex');
  const [tags] = useStore<Tag[]>('tags');
  const [tasks] = useStore<Task[]>('tasks');

  const refreshSprints = useCallback(async () => {
    const result = await api.sprints.getAll();
    setSprints(result.sprints);
  }, [setSprints]);

  const setCapacityOverride = useCallback(
    async (sprintId: string, tagId: string, capacity: number) => {
      const result = await api.sprints.setCapacityOverride(
        sprintId,
        tagId,
        capacity
      );
      setSprints((prev: Sprint[]) =>
        prev.map((s) => (s.id === sprintId ? result.sprint : s))
      );
      return result.sprint;
    },
    [setSprints]
  );

  const selectedSprint = sprints[selectedSprintIndex] || null;

  const getSprintTasks = useCallback(
    (sprint: Sprint | null) => {
      if (!sprint) return [];
      return tasks.filter(
        (t) =>
          t.location.type === 'sprint' &&
          t.location.sprintId === sprint.id &&
          t.status === 'active'
      );
    },
    [tasks]
  );

  const getSprintPointsForTag = useCallback(
    (sprint: Sprint, tagId: string) => {
      return tasks
        .filter(
          (t) =>
            t.location.type === 'sprint' &&
            t.location.sprintId === sprint.id &&
            t.status === 'active'
        )
        .reduce((sum, task) => sum + (task.tagPoints[tagId] || 0), 0);
    },
    [tasks]
  );

  const getCapacityForTag = useCallback(
    (sprint: Sprint, tagId: string) => {
      if (sprint.capacityOverrides && sprint.capacityOverrides[tagId]) {
        return sprint.capacityOverrides[tagId];
      }
      const tag = tags.find((t) => t.id === tagId);
      return tag?.defaultCapacity || 10;
    },
    [tags]
  );

  const getDaysRemaining = useCallback((sprint: Sprint) => {
    const end = new Date(sprint.endDate);
    const today = new Date();
    const diff = Math.ceil(
      (end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, diff + 1);
  }, []);

  const getSprintHealth = useCallback(
    (sprint: Sprint) => {
      let worstHealth: 'on_track' | 'at_risk' | 'off_track' = 'on_track';

      for (const tag of tags) {
        const assigned = getSprintPointsForTag(sprint, tag.id);
        const capacity = getCapacityForTag(sprint, tag.id);
        const daysRemaining = Math.max(1, getDaysRemaining(sprint));

        if (assigned === 0) continue;

        const burnRateNeeded = assigned / daysRemaining;
        const sustainableRate = capacity / 7;

        if (burnRateNeeded > sustainableRate * 1.5) {
          worstHealth = 'off_track';
        } else if (
          burnRateNeeded > sustainableRate * 1.2 &&
          worstHealth !== 'off_track'
        ) {
          worstHealth = 'at_risk';
        }
      }

      return { overall: worstHealth };
    },
    [tags, getSprintPointsForTag, getCapacityForTag, getDaysRemaining]
  );

  const getSprintLabel = useCallback((index: number) => {
    if (index === 0) return 'Current Sprint';
    if (index === 1) return 'Next Sprint';
    if (index === 2) return 'Sprint +2';
    return `Sprint ${index}`;
  }, []);

  const getSprintIcon = useCallback((index: number) => {
    if (index === 0) return 'calendar-outline';
    if (index === 1) return 'arrow-forward-outline';
    if (index === 2) return 'play-skip-forward-outline';
    return 'calendar-outline';
  }, []);

  // Helper methods to get specific sprints
  const getCurrentSprint = useCallback(() => {
    return sprints.length > 0 ? sprints[0] : null;
  }, [sprints]);

  const getNextSprint = useCallback(() => {
    return sprints.length > 1 ? sprints[1] : null;
  }, [sprints]);

  const getNextNextSprint = useCallback(() => {
    return sprints.length > 2 ? sprints[2] : null;
  }, [sprints]);

  return {
    sprints,
    selectedSprint,
    selectedSprintIndex,
    refreshSprints,
    setCapacityOverride,
    getSprintTasks,
    getSprintPointsForTag,
    getCapacityForTag,
    getDaysRemaining,
    getSprintHealth,
    getSprintLabel,
    getSprintIcon,
    getCurrentSprint,
    getNextSprint,
    getNextNextSprint,
  };
}
