/**
 * GetStatsQuery - Gets productivity statistics
 */

import { ITaskRepository, StatsCalculator, DailyStats, FocusQualityStats } from '@checkmate/domain';

export interface GetStatsQuery {
  type: 'daily' | 'weekly';
  date?: Date;
}

export interface GetStatsResult {
  tasksCompleted: number;
  pointsCompleted: number;
  focusTimeSeconds: number;
  sessionsCount: number;
  currentStreak: number;
  dailyActivity?: DailyStats[];
  pointsByTag?: Record<string, number>;
  focusQuality?: FocusQualityStats;
}

export class GetStatsHandler {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly statsCalculator: StatsCalculator
  ) {}

  async execute(query: GetStatsQuery): Promise<GetStatsResult> {
    const allTasks = await this.taskRepository.findAll();
    const date = query.date || new Date();

    if (query.type === 'daily') {
      const dailyStats = this.statsCalculator.calculateDailyStats(allTasks, date);
      const currentStreak = this.statsCalculator.calculateCurrentStreak(allTasks);

      // Calculate focus quality for today
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      const focusQuality = this.statsCalculator.calculateFocusQualityStats(allTasks, startOfDay, endOfDay);

      return {
        tasksCompleted: dailyStats.tasksCompleted,
        pointsCompleted: dailyStats.pointsCompleted,
        focusTimeSeconds: dailyStats.focusTimeSeconds,
        sessionsCount: dailyStats.sessionsCount,
        currentStreak,
        focusQuality
      };
    } else {
      const weeklyStats = this.statsCalculator.calculateWeeklyStats(allTasks, date);
      const currentStreak = this.statsCalculator.calculateCurrentStreak(allTasks);

      // Convert Map to Record
      const pointsByTag: Record<string, number> = {};
      weeklyStats.pointsByTag.forEach((value, key) => {
        pointsByTag[key] = value;
      });

      return {
        tasksCompleted: weeklyStats.tasksCompleted,
        pointsCompleted: weeklyStats.pointsCompleted,
        focusTimeSeconds: weeklyStats.focusTimeSeconds,
        sessionsCount: weeklyStats.sessionsCount,
        currentStreak,
        dailyActivity: weeklyStats.dailyActivity,
        pointsByTag
      };
    }
  }
}
