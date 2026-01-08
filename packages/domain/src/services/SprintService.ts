import { Sprint } from '../entities/Sprint';

/**
 * Domain service for sprint management
 */
export class SprintService {
  /**
   * Get the start of the week (Sunday) for a given date
   */
  getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Create the required sprints (current, next, next-next)
   */
  ensureSprintsExist(existingSprints: Sprint[], today: Date = new Date()): Sprint[] {
    const currentSunday = this.getStartOfWeek(today);
    const requiredStarts = [
      currentSunday,
      this.addDays(currentSunday, 7),
      this.addDays(currentSunday, 14),
    ];

    const newSprints: Sprint[] = [];

    for (const startDate of requiredStarts) {
      const exists = existingSprints.find(
        (s) => s.startDate.toDateString() === startDate.toDateString()
      );
      if (!exists) {
        newSprints.push(Sprint.create(startDate));
      }
    }

    return newSprints;
  }

  /**
   * Get sprint label based on index
   */
  getSprintLabel(index: number): string {
    if (index === 0) return 'Current Sprint';
    if (index === 1) return 'Next Sprint';
    if (index === 2) return 'Sprint +2';
    return `Sprint ${index}`;
  }

  /**
   * Get sprint icon based on index
   */
  getSprintIcon(index: number): string {
    if (index === 0) return 'calendar-outline';
    if (index === 1) return 'arrow-forward-outline';
    if (index === 2) return 'play-skip-forward-outline';
    return 'calendar-outline';
  }

  private addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  }
}
