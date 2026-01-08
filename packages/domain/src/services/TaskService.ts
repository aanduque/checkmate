import { Task } from '../entities/Task';
import { TagId } from '../value-objects/TagId';

/**
 * Domain service for task-related business logic
 */
export class TaskService {
  /**
   * Sort tasks for sprint display
   * Order: returned tasks at top, then normal, then skipped-for-now at bottom
   * Skipped-for-day (not returned) are hidden
   */
  sortSprintTasks(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      // Returned tasks bubble to top
      if (a.skipState?.isForDay() && a.skipState?.isReturned()) return -1;
      if (b.skipState?.isForDay() && b.skipState?.isReturned()) return 1;

      // Skipped-for-day tasks go to bottom (but are usually hidden)
      if (a.skipState?.isForDay() && !a.skipState?.isReturned()) return 1;
      if (b.skipState?.isForDay() && !b.skipState?.isReturned()) return -1;

      // Skipped-for-now go after normal tasks
      if (a.skipState?.isForNow() && !b.skipState) return 1;
      if (b.skipState?.isForNow() && !a.skipState) return -1;

      // Otherwise sort by order
      return a.order - b.order;
    });
  }

  /**
   * Get visible sprint tasks (excluding hidden skip-for-day)
   */
  getVisibleSprintTasks(tasks: Task[], now: Date = new Date()): Task[] {
    return tasks.filter((task) => {
      // Check if skip should return
      if (task.skipState?.isForDay()) {
        task.checkAndMarkSkipReturn(now);
        // Hide if skipped-for-day and not yet returned
        if (!task.skipState.isReturned()) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Get primary tag for a task (first tag in tagPoints)
   */
  getPrimaryTagId(task: Task): TagId | undefined {
    const tagIds = task.tagPoints.getTagIds();
    return tagIds[0];
  }

  /**
   * Calculate total points for a task
   */
  getTotalPoints(task: Task): number {
    return task.tagPoints.getTotalPoints();
  }

  /**
   * Check if task matches tag filter
   */
  taskMatchesTagFilter(task: Task, tagIds: TagId[]): boolean {
    if (tagIds.length === 0) return true;
    return tagIds.some((tagId) => task.tagPoints.hasTag(tagId));
  }
}
