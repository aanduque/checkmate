/**
 * RecurringTaskSpawner - Domain service for spawning task instances from templates
 *
 * Per DESIGN.md and DEC-004:
 * - Recurring tasks are templates that spawn instances
 * - Templates have a recurrence (RRule) field
 * - Instances have parentId pointing to template
 * - Spawning happens on-demand based on date range
 */

import { Task } from '../entities/Task';
import type { IRecurrenceCalculator } from '../ports/IRecurrenceCalculator';

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Domain service that spawns task instances from recurring templates
 */
export class RecurringTaskSpawner {
  constructor(private readonly recurrenceCalculator: IRecurrenceCalculator) {}

  /**
   * Spawn task instances for all templates within the given date range
   *
   * @param templates - Tasks with recurrence set (recurring templates)
   * @param existingInstances - Already spawned instances (to avoid duplicates)
   * @param dateRange - The date range to check for occurrences
   * @returns Newly spawned task instances
   */
  spawnDueInstances(
    templates: Task[],
    existingInstances: Task[],
    dateRange: DateRange
  ): Task[] {
    const spawned: Task[] = [];

    // Filter to only templates (tasks with recurrence)
    const recurringTemplates = templates.filter(t => t.isRecurringTemplate());

    if (recurringTemplates.length === 0) {
      return spawned;
    }

    // Validate date range
    if (dateRange.start > dateRange.end) {
      return spawned;
    }

    // Build a count of existing instances by parentId
    const existingCountByParentId = new Map<string, number>();
    for (const instance of existingInstances) {
      if (instance.parentId) {
        const count = existingCountByParentId.get(instance.parentId) ?? 0;
        existingCountByParentId.set(instance.parentId, count + 1);
      }
    }

    // Process each template
    for (const template of recurringTemplates) {
      const recurrence = template.recurrence;
      if (!recurrence) continue;

      // Get occurrences within the date range
      const occurrences = this.recurrenceCalculator.getOccurrences(
        recurrence,
        dateRange.start,
        dateRange.end
      );

      // Get count of existing instances for this template
      const existingCount = existingCountByParentId.get(template.id) ?? 0;

      // Calculate how many new instances to spawn
      // We spawn one instance per occurrence that doesn't already have an instance
      const instancesNeeded = occurrences.length - existingCount;

      // Spawn the needed instances
      for (let i = 0; i < instancesNeeded; i++) {
        const instance = template.spawnInstance();
        spawned.push(instance);
      }
    }

    return spawned;
  }
}
