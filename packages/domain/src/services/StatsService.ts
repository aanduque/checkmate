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
}
