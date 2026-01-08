import React, { useMemo } from 'react';
import { useSelector } from 'statux';
import type { TagDTO } from '../../services/rpcClient';
import type { ExtendedSprintDTO } from '../../mocks/mockData';
import { mockExtendedTasks } from '../../mocks/mockData';

interface SprintHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprint: ExtendedSprintDTO | null;
}

type HealthStatus = 'on_track' | 'at_risk' | 'off_track';

export function SprintHealthModal({ isOpen, onClose, sprint }: SprintHealthModalProps) {
  const tags = useSelector<TagDTO[]>('tags');

  // Calculate points assigned to sprint for a specific tag
  const getSprintPointsForTag = (sprintId: string, tagId: string): number => {
    return mockExtendedTasks
      .filter(t => t.location.type === 'sprint' && t.location.sprintId === sprintId)
      .reduce((sum, task) => sum + (task.tagPoints[tagId] || 0), 0);
  };

  // Get capacity for tag (override or default)
  const getCapacityForTag = (sprintData: ExtendedSprintDTO, tagId: string): number => {
    if (sprintData.capacityOverrides?.[tagId]) {
      return sprintData.capacityOverrides[tagId];
    }
    const tag = tags.find(t => t.id === tagId);
    return tag?.defaultCapacity || 0;
  };

  // Calculate days remaining in sprint
  const getDaysRemaining = (sprintData: ExtendedSprintDTO): number => {
    const now = new Date();
    const end = new Date(sprintData.endDate);
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff); // At least 1 day
  };

  // Calculate burn rate needed
  const getBurnRateNeeded = (sprintData: ExtendedSprintDTO, tagId: string): number => {
    const assigned = getSprintPointsForTag(sprintData.id, tagId);
    const daysRemaining = getDaysRemaining(sprintData);
    return assigned / daysRemaining;
  };

  // Determine health status
  const getTagHealth = (sprintData: ExtendedSprintDTO, tagId: string): HealthStatus => {
    const assigned = getSprintPointsForTag(sprintData.id, tagId);
    const capacity = getCapacityForTag(sprintData, tagId);

    if (capacity === 0) return 'on_track';

    const ratio = assigned / capacity;

    if (ratio <= 0.8) return 'on_track';
    if (ratio <= 1.0) return 'at_risk';
    return 'off_track';
  };

  // Memoized tag health data
  const tagHealthData = useMemo(() => {
    if (!sprint) return [];

    return tags.map(tag => ({
      tag,
      assigned: getSprintPointsForTag(sprint.id, tag.id),
      capacity: getCapacityForTag(sprint, tag.id),
      burnRate: getBurnRateNeeded(sprint, tag.id),
      sustainable: getCapacityForTag(sprint, tag.id) / 7,
      health: getTagHealth(sprint, tag.id)
    }));
  }, [sprint, tags]);

  const formatHealthLabel = (health: HealthStatus): string => {
    return health.replace('_', ' ');
  };

  const getHealthBgClass = (health: HealthStatus): string => {
    switch (health) {
      case 'on_track': return 'bg-success/10';
      case 'at_risk': return 'bg-warning/10';
      case 'off_track': return 'bg-error/10';
    }
  };

  const getHealthBadgeClass = (health: HealthStatus): string => {
    switch (health) {
      case 'on_track': return 'badge-success';
      case 'at_risk': return 'badge-warning';
      case 'off_track': return 'badge-error';
    }
  };

  if (!isOpen || !sprint) return null;

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-lg">
        {/* Close Button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold mb-4">Sprint Health Details</h3>

        <div className="space-y-4">
          {tagHealthData.map(({ tag, assigned, capacity, burnRate, sustainable, health }) => (
            <div
              key={tag.id}
              className={`p-4 rounded-lg ${getHealthBgClass(health)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{tag.icon}</span>
                  <span className="font-medium">{tag.name}</span>
                </div>
                <span className={`badge ${getHealthBadgeClass(health)}`}>
                  {formatHealthLabel(health)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="opacity-60">Assigned:</span>{' '}
                  <span className="font-medium">{assigned} pts</span>
                </div>
                <div>
                  <span className="opacity-60">Capacity:</span>{' '}
                  <span className="font-medium">{capacity} pts</span>
                </div>
                <div>
                  <span className="opacity-60">Burn rate:</span>{' '}
                  <span className="font-medium">{burnRate.toFixed(1)} pts/day</span>
                </div>
                <div>
                  <span className="opacity-60">Sustainable:</span>{' '}
                  <span className="font-medium">{sustainable.toFixed(1)} pts/day</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost">
            Close
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
