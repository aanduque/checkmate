import { describe, it, expect, beforeEach } from 'vitest';
import { StatsService } from '../../src/services/StatsService';
import { Task } from '../../src/entities/Task';
import { Tag } from '../../src/entities/Tag';
import { FocusLevel } from '../../src/value-objects/FocusLevel';

describe('StatsService', () => {
  let statsService: StatsService;

  beforeEach(() => {
    statsService = new StatsService();
  });

  describe('getTodayStats', () => {
    it('should count tasks completed today', () => {
      const today = new Date('2024-01-15T12:00:00Z');
      const task = Task.create({
        title: 'Test task',
        tagPoints: { 'tag-1': 3 },
      });
      // Simulate completion today
      task.complete();
      // Override completedAt to today
      (task as any)._completedAt = new Date('2024-01-15T10:00:00Z');

      const stats = statsService.getTodayStats([task], today);

      expect(stats.tasksCompleted).toBe(1);
      expect(stats.pointsEarned).toBe(3);
    });

    it('should not count tasks completed on different days', () => {
      const today = new Date('2024-01-15T12:00:00Z');
      const task = Task.create({
        title: 'Test task',
        tagPoints: { 'tag-1': 3 },
      });
      task.complete();
      (task as any)._completedAt = new Date('2024-01-14T10:00:00Z'); // Yesterday

      const stats = statsService.getTodayStats([task], today);

      expect(stats.tasksCompleted).toBe(0);
      expect(stats.pointsEarned).toBe(0);
    });

    it('should count sessions completed today', () => {
      const today = new Date('2024-01-15T12:00:00Z');
      const task = Task.create({
        title: 'Test task',
        tagPoints: { 'tag-1': 1 },
      });

      // Add manual session completed today
      task.addManualSession({
        duration: 25,
        date: new Date('2024-01-15T09:00:00Z'),
        focusLevel: FocusLevel.focused(),
      });

      const stats = statsService.getTodayStats([task], today);

      expect(stats.sessionsCompleted).toBe(1);
      expect(stats.focusTimeMinutes).toBe(25);
    });

    it('should sum focus time across multiple sessions', () => {
      const today = new Date('2024-01-15T12:00:00Z');
      const task = Task.create({
        title: 'Test task',
        tagPoints: { 'tag-1': 1 },
      });

      task.addManualSession({
        duration: 25,
        date: new Date('2024-01-15T09:00:00Z'),
        focusLevel: FocusLevel.focused(),
      });
      task.addManualSession({
        duration: 30,
        date: new Date('2024-01-15T10:00:00Z'),
        focusLevel: FocusLevel.neutral(),
      });

      const stats = statsService.getTodayStats([task], today);

      expect(stats.sessionsCompleted).toBe(2);
      expect(stats.focusTimeMinutes).toBe(55);
    });
  });

  describe('getWeeklyStats', () => {
    it('should return stats for last 7 days', () => {
      const today = new Date('2024-01-15T12:00:00Z');

      const stats = statsService.getWeeklyStats([], today);

      expect(stats.week.length).toBe(7);
      expect(stats.completedByDay.length).toBe(7);
      expect(stats.focusByDay.length).toBe(7);
    });

    it('should calculate completion streak', () => {
      const today = new Date('2024-01-15T12:00:00Z');

      // Create tasks completed on consecutive days
      const tasks: Task[] = [];
      for (let i = 0; i < 3; i++) {
        const task = Task.create({
          title: `Task ${i}`,
          tagPoints: { 'tag-1': 1 },
        });
        task.complete();
        const completedDate = new Date(today);
        completedDate.setDate(completedDate.getDate() - i);
        (task as any)._completedAt = completedDate;
        tasks.push(task);
      }

      const stats = statsService.getWeeklyStats(tasks, today);

      expect(stats.currentStreak).toBe(3);
    });

    it('should break streak on day with no completions', () => {
      const today = new Date('2024-01-15T12:00:00Z');

      // Task completed 3 days ago (gap in streak)
      const task = Task.create({
        title: 'Old task',
        tagPoints: { 'tag-1': 1 },
      });
      task.complete();
      const completedDate = new Date(today);
      completedDate.setDate(completedDate.getDate() - 3);
      (task as any)._completedAt = completedDate;

      const stats = statsService.getWeeklyStats([task], today);

      // Streak should be 0 since no completion today or yesterday
      expect(stats.currentStreak).toBe(0);
    });
  });

  describe('getWeeklyComparison', () => {
    it('should compare this week vs last week points', () => {
      const today = new Date('2024-01-15T12:00:00Z'); // Monday

      // Task completed this week
      const thisWeekTask = Task.create({
        title: 'This week task',
        tagPoints: { 'tag-1': 5 },
      });
      thisWeekTask.complete();
      (thisWeekTask as any)._completedAt = new Date('2024-01-15T10:00:00Z');

      // Task completed last week
      const lastWeekTask = Task.create({
        title: 'Last week task',
        tagPoints: { 'tag-1': 3 },
      });
      lastWeekTask.complete();
      (lastWeekTask as any)._completedAt = new Date('2024-01-08T10:00:00Z');

      const comparison = statsService.getWeeklyComparison([thisWeekTask, lastWeekTask], today);

      expect(comparison.thisWeekPoints).toBe(5);
      expect(comparison.lastWeekPoints).toBe(3);
      expect(comparison.trend).toBe('up');
    });

    it('should identify downward trend', () => {
      const today = new Date('2024-01-15T12:00:00Z');

      const thisWeekTask = Task.create({
        title: 'This week task',
        tagPoints: { 'tag-1': 2 },
      });
      thisWeekTask.complete();
      (thisWeekTask as any)._completedAt = new Date('2024-01-15T10:00:00Z');

      const lastWeekTask = Task.create({
        title: 'Last week task',
        tagPoints: { 'tag-1': 8 },
      });
      lastWeekTask.complete();
      (lastWeekTask as any)._completedAt = new Date('2024-01-08T10:00:00Z');

      const comparison = statsService.getWeeklyComparison([thisWeekTask, lastWeekTask], today);

      expect(comparison.thisWeekPoints).toBe(2);
      expect(comparison.lastWeekPoints).toBe(8);
      expect(comparison.trend).toBe('down');
    });

    it('should identify same trend when equal', () => {
      const today = new Date('2024-01-15T12:00:00Z');

      const thisWeekTask = Task.create({
        title: 'This week task',
        tagPoints: { 'tag-1': 5 },
      });
      thisWeekTask.complete();
      (thisWeekTask as any)._completedAt = new Date('2024-01-15T10:00:00Z');

      const lastWeekTask = Task.create({
        title: 'Last week task',
        tagPoints: { 'tag-1': 5 },
      });
      lastWeekTask.complete();
      (lastWeekTask as any)._completedAt = new Date('2024-01-08T10:00:00Z');

      const comparison = statsService.getWeeklyComparison([thisWeekTask, lastWeekTask], today);

      expect(comparison.trend).toBe('same');
    });
  });

  describe('getWeeklyPointsByTag', () => {
    it('should calculate points per tag for the week', () => {
      const today = new Date('2024-01-15T12:00:00Z');

      const tags = [
        Tag.create({ name: 'Work', icon: '💼', color: '#0000ff', defaultCapacity: 20 }),
        Tag.create({ name: 'Personal', icon: '🏠', color: '#00ff00', defaultCapacity: 10 }),
      ];

      const workTask = Task.create({
        title: 'Work task',
        tagPoints: { [tags[0].id.toString()]: 5 },
      });
      workTask.complete();
      (workTask as any)._completedAt = new Date('2024-01-15T10:00:00Z');

      const personalTask = Task.create({
        title: 'Personal task',
        tagPoints: { [tags[1].id.toString()]: 3 },
      });
      personalTask.complete();
      (personalTask as any)._completedAt = new Date('2024-01-14T10:00:00Z');

      const pointsByTag = statsService.getWeeklyPointsByTag([workTask, personalTask], tags, today);

      expect(pointsByTag[tags[0].id.toString()]).toBe(5);
      expect(pointsByTag[tags[1].id.toString()]).toBe(3);
    });
  });

  describe('getFocusQuality', () => {
    it('should calculate focus quality distribution', () => {
      const task = Task.create({
        title: 'Test task',
        tagPoints: { 'tag-1': 1 },
      });

      task.addManualSession({
        duration: 25,
        date: new Date(),
        focusLevel: FocusLevel.focused(),
      });
      task.addManualSession({
        duration: 25,
        date: new Date(),
        focusLevel: FocusLevel.focused(),
      });
      task.addManualSession({
        duration: 25,
        date: new Date(),
        focusLevel: FocusLevel.neutral(),
      });
      task.addManualSession({
        duration: 25,
        date: new Date(),
        focusLevel: FocusLevel.distracted(),
      });

      const quality = statsService.getFocusQuality([task]);

      expect(quality.focused).toBe(2);
      expect(quality.neutral).toBe(1);
      expect(quality.distracted).toBe(1);
    });

    it('should return percentages', () => {
      const task = Task.create({
        title: 'Test task',
        tagPoints: { 'tag-1': 1 },
      });

      task.addManualSession({
        duration: 25,
        date: new Date(),
        focusLevel: FocusLevel.focused(),
      });
      task.addManualSession({
        duration: 25,
        date: new Date(),
        focusLevel: FocusLevel.neutral(),
      });

      const percentages = statsService.getFocusQualityPercentages([task]);

      expect(percentages.focusedPercent).toBe(50);
      expect(percentages.neutralPercent).toBe(50);
      expect(percentages.distractedPercent).toBe(0);
    });
  });

  describe('getTagPerformance', () => {
    it('should calculate tag performance metrics', () => {
      const tags = [
        Tag.create({ name: 'Work', icon: '💼', color: '#0000ff', defaultCapacity: 20 }),
      ];

      const completedTask = Task.create({
        title: 'Completed task',
        tagPoints: { [tags[0].id.toString()]: 3 },
      });
      completedTask.complete();

      const activeTask = Task.create({
        title: 'Active task',
        tagPoints: { [tags[0].id.toString()]: 5 },
      });

      const performance = statsService.getTagPerformance([completedTask, activeTask], tags);

      expect(performance[0].pointsCompleted).toBe(3);
      expect(performance[0].pointsTotal).toBe(8);
      expect(performance[0].percentage).toBeCloseTo(37.5);
    });
  });

  describe('canceled tasks in stats', () => {
    it('should include canceled tasks in appropriate stats', () => {
      const today = new Date('2024-01-15T12:00:00Z');

      const canceledTask = Task.create({
        title: 'Canceled task',
        tagPoints: { 'tag-1': 5 },
      });
      canceledTask.cancelWithJustification('No longer needed');
      (canceledTask as any)._canceledAt = new Date('2024-01-15T10:00:00Z');

      const stats = statsService.getCanceledTasksStats([canceledTask], today);

      expect(stats.canceledToday).toBe(1);
      expect(stats.canceledPointsToday).toBe(5);
    });
  });
});
