import { describe, it, expect, beforeEach } from 'vitest';
import { GetFocusTaskQuery, GetFocusTaskHandler } from '../../src/queries/GetFocusTaskQuery';
import { ITaskRepository, Task, TaskLocation, TaskOrderingService } from '@checkmate/domain';

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

describe('GetFocusTaskQuery', () => {
  let handler: GetFocusTaskHandler;
  let taskRepository: InMemoryTaskRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    const orderingService = new TaskOrderingService();
    handler = new GetFocusTaskHandler(taskRepository, orderingService);
  });

  describe('execute', () => {
    it('should return null when no active tasks exist', async () => {
      const query: GetFocusTaskQuery = { sprintId: 'sprint-123' };
      const result = await handler.execute(query);

      expect(result.focusTask).toBeNull();
      expect(result.upNext).toEqual([]);
    });

    it('should return first active task in sprint as focus task', async () => {
      const task1 = Task.create({ title: 'Task 1', tagPoints: { 'tag-1': 3 } }).moveToSprint('sprint-123');
      const task2 = Task.create({ title: 'Task 2', tagPoints: { 'tag-1': 5 } }).moveToSprint('sprint-123');
      taskRepository.addTask(task1);
      taskRepository.addTask(task2);

      const query: GetFocusTaskQuery = { sprintId: 'sprint-123' };
      const result = await handler.execute(query);

      expect(result.focusTask).not.toBeNull();
      expect(result.focusTask!.id).toBe(task1.id);
    });

    it('should return remaining tasks in upNext', async () => {
      const task1 = Task.create({ title: 'Task 1', tagPoints: { 'tag-1': 3 } }).moveToSprint('sprint-123');
      const task2 = Task.create({ title: 'Task 2', tagPoints: { 'tag-1': 5 } }).moveToSprint('sprint-123');
      const task3 = Task.create({ title: 'Task 3', tagPoints: { 'tag-1': 2 } }).moveToSprint('sprint-123');
      taskRepository.addTask(task1);
      taskRepository.addTask(task2);
      taskRepository.addTask(task3);

      const query: GetFocusTaskQuery = { sprintId: 'sprint-123' };
      const result = await handler.execute(query);

      expect(result.upNext.length).toBe(2);
    });

    it('should exclude completed tasks', async () => {
      const task1 = Task.create({ title: 'Done Task', tagPoints: { 'tag-1': 3 } })
        .moveToSprint('sprint-123')
        .complete();
      const task2 = Task.create({ title: 'Active Task', tagPoints: { 'tag-1': 5 } }).moveToSprint('sprint-123');
      taskRepository.addTask(task1);
      taskRepository.addTask(task2);

      const query: GetFocusTaskQuery = { sprintId: 'sprint-123' };
      const result = await handler.execute(query);

      expect(result.focusTask!.id).toBe(task2.id);
      expect(result.upNext.length).toBe(0);
    });

    it('should put skipped-for-now tasks at the end', async () => {
      const task1 = Task.create({ title: 'Skipped Task', tagPoints: { 'tag-1': 3 } }).moveToSprint('sprint-123');
      const skippedTask = task1.skipForNow();
      const task2 = Task.create({ title: 'Normal Task', tagPoints: { 'tag-1': 5 } }).moveToSprint('sprint-123');
      taskRepository.addTask(skippedTask);
      taskRepository.addTask(task2);

      const query: GetFocusTaskQuery = { sprintId: 'sprint-123' };
      const result = await handler.execute(query);

      expect(result.focusTask!.title).toBe('Normal Task');
      expect(result.upNext[0].title).toBe('Skipped Task');
    });

    it('should hide skipped-for-day tasks that have not returned', async () => {
      const task1 = Task.create({ title: 'Skipped Day Task', tagPoints: { 'tag-1': 3 } }).moveToSprint('sprint-123');
      const { task: skippedDayTask } = task1.skipForDay('Need more info');
      const task2 = Task.create({ title: 'Normal Task', tagPoints: { 'tag-1': 5 } }).moveToSprint('sprint-123');
      taskRepository.addTask(skippedDayTask);
      taskRepository.addTask(task2);

      const query: GetFocusTaskQuery = { sprintId: 'sprint-123' };
      const result = await handler.execute(query);

      expect(result.focusTask!.title).toBe('Normal Task');
      expect(result.upNext.length).toBe(0);
      expect(result.hiddenCount).toBe(1);
    });

    it('should include active session info if present', async () => {
      const task = Task.create({ title: 'Task with Session', tagPoints: { 'tag-1': 3 } }).moveToSprint('sprint-123');
      const { task: taskWithSession, sessionId } = task.startSession(25);
      taskRepository.addTask(taskWithSession);

      const query: GetFocusTaskQuery = { sprintId: 'sprint-123' };
      const result = await handler.execute(query);

      expect(result.focusTask!.activeSession).toBeDefined();
      expect(result.focusTask!.activeSession!.id).toBe(sessionId);
    });
  });
});
