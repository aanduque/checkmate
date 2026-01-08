import { Sprint } from '../entities/Sprint';
import { Task } from '../entities/Task';
import { Tag } from '../entities/Tag';
import { TagId } from '../value-objects/TagId';

export type SprintHealthStatus = 'on_track' | 'at_risk' | 'off_track';

export interface TagHealthDetail {
  tagId: string;
  health: SprintHealthStatus;
  assignedPoints: number;
  availableCapacity: number;
  dailyBurnRateNeeded: number;
  sustainableDailyRate: number;
}

export interface SprintHealthReport {
  overallHealth: SprintHealthStatus;
  tagHealths: TagHealthDetail[];
  warnings: string[];
}

/**
 * Domain service for calculating sprint health
 */
export class SprintHealthService {
  /**
   * Calculate health status for a sprint based on assigned points,
   * capacity, and remaining time
   */
  calculate(
    sprint: Sprint,
    tasks: Task[],
    tags: Tag[],
    today: Date = new Date()
  ): SprintHealthReport {
    const tagHealths: TagHealthDetail[] = [];
    const warnings: string[] = [];
    let overallHealth: SprintHealthStatus = 'on_track';

    // Get tasks in this sprint
    const sprintTasks = tasks.filter(
      (t) =>
        t.isActive() &&
        t.location.isSprint() &&
        t.location.getSprintId()?.equals(sprint.id)
    );

    for (const tag of tags) {
      const detail = this.calculateTagHealth(sprint, sprintTasks, tag, today);
      tagHealths.push(detail);

      // Track worst health
      if (detail.health === 'off_track') {
        overallHealth = 'off_track';
        warnings.push(
          `${tag.name} is off track: ${detail.dailyBurnRateNeeded.toFixed(1)} pts/day needed vs ${detail.sustainableDailyRate.toFixed(1)} sustainable`
        );
      } else if (detail.health === 'at_risk' && overallHealth !== 'off_track') {
        overallHealth = 'at_risk';
        warnings.push(
          `${tag.name} is at risk: burn rate is above sustainable`
        );
      }
    }

    return {
      overallHealth,
      tagHealths,
      warnings,
    };
  }

  private calculateTagHealth(
    sprint: Sprint,
    tasks: Task[],
    tag: Tag,
    today: Date
  ): TagHealthDetail {
    // Calculate assigned points for this tag
    const assignedPoints = tasks.reduce((sum, task) => {
      const points = task.tagPoints.getPointsForTag(tag.id);
      return sum + (points?.toNumber() ?? 0);
    }, 0);

    const availableCapacity = sprint.getCapacityForTag(
      tag.id,
      tag.defaultCapacity
    );
    const daysRemaining = Math.max(1, sprint.getDaysRemaining(today));
    const dailyBurnRateNeeded = assignedPoints / daysRemaining;
    const sustainableDailyRate = availableCapacity / 7;

    let health: SprintHealthStatus = 'on_track';

    if (assignedPoints > 0) {
      if (dailyBurnRateNeeded > sustainableDailyRate * 1.5) {
        health = 'off_track';
      } else if (dailyBurnRateNeeded > sustainableDailyRate * 1.2) {
        health = 'at_risk';
      }
    }

    return {
      tagId: tag.id.toString(),
      health,
      assignedPoints,
      availableCapacity,
      dailyBurnRateNeeded,
      sustainableDailyRate,
    };
  }

  /**
   * Get points assigned to a specific tag in a sprint
   */
  getSprintPointsForTag(
    sprint: Sprint,
    tasks: Task[],
    tagId: TagId
  ): number {
    return tasks
      .filter(
        (t) =>
          t.isActive() &&
          t.location.isSprint() &&
          t.location.getSprintId()?.equals(sprint.id)
      )
      .reduce((sum, task) => {
        const points = task.tagPoints.getPointsForTag(tagId);
        return sum + (points?.toNumber() ?? 0);
      }, 0);
  }
}
