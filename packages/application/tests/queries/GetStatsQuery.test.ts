import { describe, it, expect, beforeEach } from 'vitest';
import { GetStatsQuery, GetStatsHandler } from '../../src/queries/GetStatsQuery';
import { ITaskRepository, Task, TaskLocation, FocusLevel, StatsCalculator } from '@checkmate/domain';

class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async findByLocation(location: TaskLocation): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => {
      if (location.isBacklog()) return t.location.isBacklog();
      if (location.isSprint()) return t.location.sprintId === location.sprintId;
      return false;
    });
  }

  async findTemplates(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.isRecurringTemplate());
  }

  async findActive(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.status.isActive());
  }

  async findCompleted(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.status.isCompleted());
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  addTask(task: Task): void {
    this.tasks.set(task.id, task);
  }
}

describe('GetStatsQuery', () => {
  let handler: GetStatsHandler;
  let taskRepository: InMemoryTaskRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    const statsCalculator = new StatsCalculator();
    handler = new GetStatsHandler(taskRepository, statsCalculator);
  });

  describe('execute - daily stats', () => {
    it('should return zero stats when no tasks exist', async () => {
      const query: GetStatsQuery = { type: 'daily' };
      const result = await handler.execute(query);

      expect(result.tasksCompleted).toBe(0);
      expect(result.pointsCompleted).toBe(0);
      expect(result.focusTimeSeconds).toBe(0);
      expect(result.sessionsCount).toBe(0);
    });

    it('should count completed tasks for today', async () => {
      const task = Task.create({ title: 'Task 1', tagPoints: { 'tag-1': 5 } });
      const completedTask = task.complete();
      taskRepository.addTask(completedTask);

      const query: GetStatsQuery = { type: 'daily' };
      const result = await handler.execute(query);

      expect(result.tasksCompleted).toBe(1);
      expect(result.pointsCompleted).toBe(5);
    });

    it('should include canceled tasks in stats', async () => {
      const task = Task.create({ title: 'Task 1', tagPoints: { 'tag-1': 3 } });
      const { task: canceledTask } = task.cancel('No longer needed');
      taskRepository.addTask(canceledTask);

      const query: GetStatsQuery = { type: 'daily' };
      const result = await handler.execute(query);

      expect(result.tasksCompleted).toBe(1);
    });

    it('should not count active tasks', async () => {
      const task = Task.create({ title: 'Active Task', tagPoints: { 'tag-1': 5 } });
      taskRepository.addTask(task);

      const query: GetStatsQuery = { type: 'daily' };
      const result = await handler.execute(query);

      expect(result.tasksCompleted).toBe(0);
    });
  });

  describe('execute - weekly stats', () => {
    it('should return weekly stats with daily breakdown', async () => {
      const task = Task.create({ title: 'Task 1', tagPoints: { 'tag-1': 5 } });
      const completedTask = task.complete();
      taskRepository.addTask(completedTask);

      const query: GetStatsQuery = { type: 'weekly' };
      const result = await handler.execute(query);

      expect(result.dailyActivity).toBeDefined();
      expect(result.dailyActivity!.length).toBe(7);
    });

    it('should include points by tag', async () => {
      const task = Task.create({ title: 'Task 1', tagPoints: { 'work': 5, 'dev': 3 } });
      const completedTask = task.complete();
      taskRepository.addTask(completedTask);

      const query: GetStatsQuery = { type: 'weekly' };
      const result = await handler.execute(query);

      expect(result.pointsByTag).toBeDefined();
    });
  });

  describe('execute - current streak', () => {
    it('should calculate current streak', async () => {
      const task = Task.create({ title: 'Task 1', tagPoints: { 'tag-1': 5 } });
      const completedTask = task.complete();
      taskRepository.addTask(completedTask);

      const query: GetStatsQuery = { type: 'daily' };
      const result = await handler.execute(query);

      expect(result.currentStreak).toBeDefined();
      expect(result.currentStreak).toBeGreaterThanOrEqual(0);
    });
  });

  describe('execute - focus quality', () => {
    it('should calculate focus quality stats', async () => {
      const task = Task.create({ title: 'Task 1', tagPoints: { 'tag-1': 5 } });
      const { task: taskWithSession, sessionId } = task.startSession(25);
      const completedTask = taskWithSession.endSession(sessionId, FocusLevel.focused());
      taskRepository.addTask(completedTask);

      const query: GetStatsQuery = { type: 'daily' };
      const result = await handler.execute(query);

      expect(result.focusQuality).toBeDefined();
      expect(result.focusQuality!.total).toBe(1);
      expect(result.focusQuality!.positive).toBe(1);
    });
  });
});
