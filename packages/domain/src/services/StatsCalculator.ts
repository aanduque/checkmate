/**
 * StatsCalculator - Calculates productivity statistics
 * Domain Service
 */

import { Task } from '../entities/Task';
import { Session } from '../entities/Session';

export interface DailyStats {
  date: Date;
  tasksCompleted: number;
  pointsCompleted: number;
  focusTimeSeconds: number;
  sessionsCount: number;
}

export interface WeeklyStats {
  weekStartDate: Date;
  tasksCompleted: number;
  pointsCompleted: number;
  focusTimeSeconds: number;
  sessionsCount: number;
  pointsByTag: Map<string, number>;
  dailyActivity: DailyStats[];
}

export interface FocusQualityStats {
  total: number;
  positive: number; // focused
  neutral: number;
  negative: number; // distracted
  positivePercent: number;
  avgDurationSeconds: number;
}

export class StatsCalculator {
  /**
   * Get the start of a day (midnight)
   */
  private getStartOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get the start of the week (Monday)
   */
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get tasks completed within a date range
   */
  getCompletedTasksInRange(tasks: Task[], startDate: Date, endDate: Date): Task[] {
    return tasks.filter(t => {
      if (t.status.isCompleted() && t.completedAt) {
        return t.completedAt >= startDate && t.completedAt < endDate;
      }
      if (t.status.isCanceled() && t.canceledAt) {
        return t.canceledAt >= startDate && t.canceledAt < endDate;
      }
      return false;
    });
  }

  /**
   * Get sessions completed within a date range
   */
  getSessionsInRange(tasks: Task[], startDate: Date, endDate: Date): Session[] {
    const sessions: Session[] = [];
    for (const task of tasks) {
      for (const session of task.sessions) {
        if (session.status.isCompleted() && session.endedAt) {
          if (session.endedAt >= startDate && session.endedAt < endDate) {
            sessions.push(session);
          }
        }
      }
    }
    return sessions;
  }

  /**
   * Calculate daily stats for a given day
   */
  calculateDailyStats(tasks: Task[], date: Date): DailyStats {
    const startOfDay = this.getStartOfDay(date);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const completed = this.getCompletedTasksInRange(tasks, startOfDay, endOfDay);
    const sessions = this.getSessionsInRange(tasks, startOfDay, endOfDay);

    return {
      date: startOfDay,
      tasksCompleted: completed.length,
      pointsCompleted: completed.reduce((sum, t) => sum + t.totalPoints, 0),
      focusTimeSeconds: sessions.reduce((sum, s) => sum + s.durationSeconds, 0),
      sessionsCount: sessions.length
    };
  }

  /**
   * Calculate weekly stats
   */
  calculateWeeklyStats(tasks: Task[], weekStartDate?: Date): WeeklyStats {
    const startOfWeek = weekStartDate
      ? this.getStartOfWeek(weekStartDate)
      : this.getStartOfWeek(new Date());

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const completed = this.getCompletedTasksInRange(tasks, startOfWeek, endOfWeek);
    const sessions = this.getSessionsInRange(tasks, startOfWeek, endOfWeek);

    // Calculate points by tag
    const pointsByTag = new Map<string, number>();
    for (const task of completed) {
      for (const tagId of task.tagPoints.tagIds()) {
        const current = pointsByTag.get(tagId) || 0;
        pointsByTag.set(tagId, current + task.tagPoints.getValue(tagId));
      }
    }

    // Calculate daily activity
    const dailyActivity: DailyStats[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(dayDate.getDate() + i);
      dailyActivity.push(this.calculateDailyStats(tasks, dayDate));
    }

    return {
      weekStartDate: startOfWeek,
      tasksCompleted: completed.length,
      pointsCompleted: completed.reduce((sum, t) => sum + t.totalPoints, 0),
      focusTimeSeconds: sessions.reduce((sum, s) => sum + s.durationSeconds, 0),
      sessionsCount: sessions.length,
      pointsByTag,
      dailyActivity
    };
  }

  /**
   * Calculate focus quality stats for a date range
   */
  calculateFocusQualityStats(
    tasks: Task[],
    startDate: Date,
    endDate: Date
  ): FocusQualityStats {
    const sessions = this.getSessionsInRange(tasks, startDate, endDate);

    const total = sessions.length;
    let positive = 0;
    let neutral = 0;
    let negative = 0;
    let totalDuration = 0;

    for (const session of sessions) {
      if (session.focusLevel?.isFocused()) positive++;
      else if (session.focusLevel?.isNeutral()) neutral++;
      else if (session.focusLevel?.isDistracted()) negative++;

      totalDuration += session.durationSeconds;
    }

    return {
      total,
      positive,
      neutral,
      negative,
      positivePercent: total > 0 ? Math.round((positive / total) * 100) : 0,
      avgDurationSeconds: total > 0 ? Math.round(totalDuration / total) : 0
    };
  }

  /**
   * Calculate current streak (consecutive days with completions)
   */
  calculateCurrentStreak(tasks: Task[]): number {
    let streak = 0;
    const today = this.getStartOfDay(new Date());
    let checkDate = new Date(today);

    // Check if today has completions, otherwise start from yesterday
    const todayStats = this.calculateDailyStats(tasks, today);
    if (todayStats.tasksCompleted === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dayStart = new Date(checkDate);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const completed = this.getCompletedTasksInRange(tasks, dayStart, dayEnd);
      if (completed.length === 0) break;

      streak++;
      checkDate.setDate(checkDate.getDate() - 1);

      // Safety limit
      if (streak > 365) break;
    }

    return streak;
  }
}
