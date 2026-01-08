import { Task } from '../entities/Task';
import { Session } from '../entities/Session';
import { Tag } from '../entities/Tag';

export interface DailyStats {
  tasksCompleted: number;
  pointsEarned: number;
  focusTimeMinutes: number;
  sessionsCompleted: number;
}

export interface TagPerformance {
  tagId: string;
  tagName: string;
  tagColor: string;
  pointsCompleted: number;
  pointsTotal: number;
  percentage: number;
}

export interface WeeklyStats {
  week: Date[];
  completedByDay: number[];
  focusByDay: number[];
  currentStreak: number;
}

/**
 * Domain service for calculating stats and insights
 */
export class StatsService {
  /**
   * Calculate stats for today
   */
  getTodayStats(tasks: Task[], today: Date = new Date()): DailyStats {
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    let tasksCompleted = 0;
    let pointsEarned = 0;
    let focusTimeMinutes = 0;
    let sessionsCompleted = 0;

    for (const task of tasks) {
      // Count completed tasks today
      if (
        task.isCompleted() &&
        task.completedAt &&
        task.completedAt >= startOfDay &&
        task.completedAt <= endOfDay
      ) {
        tasksCompleted++;
        pointsEarned += task.tagPoints.getTotalPoints();
      }

      // Count sessions completed today
      for (const session of task.sessions) {
        if (
          session.isCompleted() &&
          session.endedAt &&
          session.endedAt >= startOfDay &&
          session.endedAt <= endOfDay
        ) {
          sessionsCompleted++;
          const duration = session.getDuration();
          if (duration) {
            focusTimeMinutes += Math.floor(duration / 60);
          }
        }
      }
    }

    return {
      tasksCompleted,
      pointsEarned,
      focusTimeMinutes,
      sessionsCompleted,
    };
  }

  /**
   * Calculate tag performance for current sprint
   */
  getTagPerformance(
    tasks: Task[],
    tags: Tag[],
    sprintId?: string
  ): TagPerformance[] {
    const performances: TagPerformance[] = [];

    for (const tag of tags) {
      let pointsCompleted = 0;
      let pointsTotal = 0;

      for (const task of tasks) {
        // Filter by sprint if provided
        if (sprintId && task.location.isSprint()) {
          const taskSprintId = task.location.getSprintId()?.toString();
          if (taskSprintId !== sprintId) continue;
        }

        const points = task.tagPoints.getPointsForTag(tag.id);
        if (points) {
          pointsTotal += points.toNumber();
          if (task.isCompleted()) {
            pointsCompleted += points.toNumber();
          }
        }
      }

      performances.push({
        tagId: tag.id.toString(),
        tagName: tag.name,
        tagColor: tag.color,
        pointsCompleted,
        pointsTotal,
        percentage: pointsTotal > 0 ? (pointsCompleted / pointsTotal) * 100 : 0,
      });
    }

    return performances;
  }

  /**
   * Calculate weekly activity stats
   */
  getWeeklyStats(tasks: Task[], today: Date = new Date()): WeeklyStats {
    const week: Date[] = [];
    const completedByDay: number[] = [];
    const focusByDay: number[] = [];

    // Build week array (last 7 days)
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      week.push(day);
    }

    for (const day of week) {
      const startOfDay = new Date(day);
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);

      let completed = 0;
      let focusMinutes = 0;

      for (const task of tasks) {
        if (
          task.isCompleted() &&
          task.completedAt &&
          task.completedAt >= startOfDay &&
          task.completedAt <= endOfDay
        ) {
          completed++;
        }

        for (const session of task.sessions) {
          if (
            session.isCompleted() &&
            session.endedAt &&
            session.endedAt >= startOfDay &&
            session.endedAt <= endOfDay
          ) {
            const duration = session.getDuration();
            if (duration) {
              focusMinutes += Math.floor(duration / 60);
            }
          }
        }
      }

      completedByDay.push(completed);
      focusByDay.push(focusMinutes);
    }

    // Calculate streak
    let currentStreak = 0;
    for (let i = completedByDay.length - 1; i >= 0; i--) {
      if (completedByDay[i] > 0) {
        currentStreak++;
      } else if (i < completedByDay.length - 1) {
        // Don't break streak if today has no completions yet
        break;
      }
    }

    return {
      week,
      completedByDay,
      focusByDay,
      currentStreak,
    };
  }

  /**
   * Calculate focus quality breakdown
   */
  getFocusQuality(tasks: Task[]): {
    focused: number;
    neutral: number;
    distracted: number;
  } {
    let focused = 0;
    let neutral = 0;
    let distracted = 0;

    for (const task of tasks) {
      for (const session of task.sessions) {
        if (session.isCompleted() && session.focusLevel) {
          if (session.focusLevel.isFocused()) focused++;
          else if (session.focusLevel.isNeutral()) neutral++;
          else if (session.focusLevel.isDistracted()) distracted++;
        }
      }
    }

    return { focused, neutral, distracted };
  }

  /**
   * Calculate focus quality as percentages
   */
  getFocusQualityPercentages(tasks: Task[]): {
    focusedPercent: number;
    neutralPercent: number;
    distractedPercent: number;
  } {
    const quality = this.getFocusQuality(tasks);
    const total = quality.focused + quality.neutral + quality.distracted;

    if (total === 0) {
      return { focusedPercent: 0, neutralPercent: 0, distractedPercent: 0 };
    }

    return {
      focusedPercent: (quality.focused / total) * 100,
      neutralPercent: (quality.neutral / total) * 100,
      distractedPercent: (quality.distracted / total) * 100,
    };
  }

  /**
   * Compare this week vs last week
   */
  getWeeklyComparison(
    tasks: Task[],
    today: Date = new Date()
  ): {
    thisWeekPoints: number;
    lastWeekPoints: number;
    trend: 'up' | 'down' | 'same';
  } {
    const startOfThisWeek = this.getStartOfWeek(today);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    let thisWeekPoints = 0;
    let lastWeekPoints = 0;

    for (const task of tasks) {
      if (task.isCompleted() && task.completedAt) {
        const points = task.tagPoints.getTotalPoints();
        if (task.completedAt >= startOfThisWeek) {
          thisWeekPoints += points;
        } else if (task.completedAt >= startOfLastWeek && task.completedAt < startOfThisWeek) {
          lastWeekPoints += points;
        }
      }
    }

    let trend: 'up' | 'down' | 'same' = 'same';
    if (thisWeekPoints > lastWeekPoints) {
      trend = 'up';
    } else if (thisWeekPoints < lastWeekPoints) {
      trend = 'down';
    }

    return { thisWeekPoints, lastWeekPoints, trend };
  }

  /**
   * Calculate weekly points by tag
   */
  getWeeklyPointsByTag(
    tasks: Task[],
    tags: Tag[],
    today: Date = new Date()
  ): Record<string, number> {
    const startOfWeek = this.getStartOfWeek(today);
    const pointsByTag: Record<string, number> = {};

    // Initialize all tags to 0
    for (const tag of tags) {
      pointsByTag[tag.id.toString()] = 0;
    }

    for (const task of tasks) {
      if (task.isCompleted() && task.completedAt && task.completedAt >= startOfWeek) {
        const tagPointsRecord = task.tagPoints.toRecord();
        for (const [tagId, points] of Object.entries(tagPointsRecord)) {
          if (pointsByTag[tagId] !== undefined) {
            pointsByTag[tagId] += points;
          }
        }
      }
    }

    return pointsByTag;
  }

  /**
   * Get stats for canceled tasks
   */
  getCanceledTasksStats(
    tasks: Task[],
    today: Date = new Date()
  ): {
    canceledToday: number;
    canceledPointsToday: number;
    canceledThisWeek: number;
    canceledPointsThisWeek: number;
  } {
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const startOfWeek = this.getStartOfWeek(today);

    let canceledToday = 0;
    let canceledPointsToday = 0;
    let canceledThisWeek = 0;
    let canceledPointsThisWeek = 0;

    for (const task of tasks) {
      if (task.isCanceled() && task.canceledAt) {
        const points = task.tagPoints.getTotalPoints();

        if (task.canceledAt >= startOfDay && task.canceledAt <= endOfDay) {
          canceledToday++;
          canceledPointsToday += points;
        }

        if (task.canceledAt >= startOfWeek) {
          canceledThisWeek++;
          canceledPointsThisWeek += points;
        }
      }
    }

    return {
      canceledToday,
      canceledPointsToday,
      canceledThisWeek,
      canceledPointsThisWeek,
    };
  }

  /**
   * Helper: Get start of week (Sunday)
   */
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
