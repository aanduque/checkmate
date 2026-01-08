/**
 * SprintHealthCalculator - Calculates sprint health metrics
 * Domain Service
 *
 * Per DEC-012: Sprint health is based on burn rate vs sustainable rate
 */

import { Sprint } from '../entities/Sprint';
import { Task } from '../entities/Task';
import { Tag } from '../entities/Tag';

export type HealthStatus = 'on_track' | 'at_risk' | 'off_track';

export interface TagHealthReport {
  tagId: string;
  assignedPoints: number;
  capacity: number;
  burnRateNeeded: number;
  sustainableRate: number;
  health: HealthStatus;
}

export interface SprintHealthReport {
  sprintId: string;
  daysRemaining: number;
  overall: HealthStatus;
  byTag: TagHealthReport[];
}

export class SprintHealthCalculator {
  /**
   * Calculate health for a specific tag in a sprint
   */
  calculateTagHealth(
    sprint: Sprint,
    tagId: string,
    tasks: Task[],
    defaultCapacity: number
  ): TagHealthReport {
    const assignedPoints = tasks
      .filter(t => t.status.isActive() && t.location.sprintId === sprint.id)
      .reduce((sum, task) => sum + task.tagPoints.getValue(tagId), 0);

    const capacity = sprint.getCapacity(tagId, defaultCapacity);
    const daysRemaining = Math.max(1, sprint.getDaysRemaining());

    const burnRateNeeded = assignedPoints / daysRemaining;
    const sustainableRate = capacity / 7; // Points per day sustainable

    let health: HealthStatus = 'on_track';
    if (assignedPoints > 0) {
      if (burnRateNeeded > sustainableRate * 1.5) {
        health = 'off_track';
      } else if (burnRateNeeded > sustainableRate * 1.2) {
        health = 'at_risk';
      }
    }

    return {
      tagId,
      assignedPoints,
      capacity,
      burnRateNeeded,
      sustainableRate,
      health
    };
  }

  /**
   * Calculate overall sprint health across all tags
   */
  calculateSprintHealth(
    sprint: Sprint,
    tasks: Task[],
    tags: Tag[]
  ): SprintHealthReport {
    const byTag = tags.map(tag =>
      this.calculateTagHealth(sprint, tag.id, tasks, tag.defaultCapacity)
    );

    // Overall health is the worst health across all tags
    let overall: HealthStatus = 'on_track';
    for (const report of byTag) {
      if (report.health === 'off_track') {
        overall = 'off_track';
        break;
      }
      if (report.health === 'at_risk' && overall !== 'off_track') {
        overall = 'at_risk';
      }
    }

    return {
      sprintId: sprint.id,
      daysRemaining: sprint.getDaysRemaining(),
      overall,
      byTag
    };
  }
}
