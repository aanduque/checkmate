/**
 * TaskOrderingService - Handles task ordering in the focus queue
 * Domain Service
 *
 * Per DEC-005, DEC-006: Skip state affects ordering
 * - Skipped for now: goes to bottom
 * - Skipped for day (returned): goes to top
 */

import { Task } from '../entities/Task';

export class TaskOrderingService {
  /**
   * Sort tasks for focus view display
   * Order: returned tasks > normal tasks > skipped for now > skipped for day (hidden)
   */
  sortForFocus(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => {
      const aSkip = a.skipState;
      const bSkip = b.skipState;

      // Returned tasks bubble to top
      if (aSkip?.isForDay() && aSkip?.returned) return -1;
      if (bSkip?.isForDay() && bSkip?.returned) return 1;

      // Skipped for day (not returned) go to bottom (hidden)
      if (aSkip?.isForDay() && !aSkip?.returned) return 1;
      if (bSkip?.isForDay() && !bSkip?.returned) return -1;

      // Skipped for now go after normal tasks
      if (aSkip?.isForNow() && !bSkip) return 1;
      if (bSkip?.isForNow() && !aSkip) return -1;

      // Otherwise maintain original order
      return 0;
    });
  }

  /**
   * Get the task that should be focused on (first non-hidden task)
   */
  getFocusTask(tasks: Task[]): Task | null {
    const sorted = this.sortForFocus(tasks);

    for (const task of sorted) {
      // Skip tasks that are hidden (for_day and not returned)
      if (task.skipState?.isForDay() && !task.skipState?.returned) {
        continue;
      }
      return task;
    }

    return null;
  }

  /**
   * Get tasks after the focus task (up next queue)
   */
  getUpNextTasks(tasks: Task[]): Task[] {
    const sorted = this.sortForFocus(tasks);
    const focusTask = this.getFocusTask(tasks);

    if (!focusTask) return [];

    const focusIndex = sorted.findIndex(t => t.id === focusTask.id);
    return sorted.slice(focusIndex + 1).filter(t => {
      // Exclude hidden tasks
      return !(t.skipState?.isForDay() && !t.skipState?.returned);
    });
  }

  /**
   * Check if a task should be visible in the focus view
   */
  isVisibleInFocus(task: Task): boolean {
    // Tasks skipped for day are hidden until they return
    if (task.skipState?.isForDay() && !task.skipState?.returned) {
      return false;
    }
    return true;
  }
}
