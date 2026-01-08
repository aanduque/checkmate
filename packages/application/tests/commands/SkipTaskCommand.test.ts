import { describe, it, expect, beforeEach } from 'vitest';
import { SkipTaskCommand, SkipTaskHandler } from '../../src/commands/SkipTaskCommand';
import { ITaskRepository, Task, TaskLocation } from '@checkmate/domain';

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

describe('SkipTaskCommand', () => {
  let handler: SkipTaskHandler;
  let taskRepository: InMemoryTaskRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    handler = new SkipTaskHandler(taskRepository);
  });

  describe('execute - skip for now', () => {
    it('should skip a task for now', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: SkipTaskCommand = {
        taskId: task.id,
        type: 'for_now'
      };
      const result = await handler.execute(command);

      expect(result.skipState).toBeDefined();
      expect(result.skipState!.type).toBe('for_now');
    });

    it('should not require justification for skip for now', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: SkipTaskCommand = {
        taskId: task.id,
        type: 'for_now'
      };

      await expect(handler.execute(command)).resolves.toBeDefined();
    });

    it('should persist skipped task', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: SkipTaskCommand = {
        taskId: task.id,
        type: 'for_now'
      };
      await handler.execute(command);

      const saved = await taskRepository.findById(task.id);
      expect(saved!.skipState).toBeDefined();
    });
  });

  describe('execute - skip for day', () => {
    it('should skip a task for the day with justification', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: SkipTaskCommand = {
        taskId: task.id,
        type: 'for_day',
        justification: 'Waiting for dependencies'
      };
      const result = await handler.execute(command);

      expect(result.skipState).toBeDefined();
      expect(result.skipState!.type).toBe('for_day');
    });

    it('should require justification for skip for day', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: SkipTaskCommand = {
        taskId: task.id,
        type: 'for_day',
        justification: ''
      };

      await expect(handler.execute(command)).rejects.toThrow();
    });

    it('should create a justification comment in the task', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: SkipTaskCommand = {
        taskId: task.id,
        type: 'for_day',
        justification: 'Waiting for dependencies'
      };
      await handler.execute(command);

      const saved = await taskRepository.findById(task.id);
      expect(saved!.comments.length).toBe(1);
      expect(saved!.comments[0].content).toBe('Waiting for dependencies');
      expect(saved!.comments[0].isSkipJustification).toBe(true);
    });
  });

  describe('execute - common', () => {
    it('should throw if task not found', async () => {
      const command: SkipTaskCommand = {
        taskId: 'non-existent',
        type: 'for_now'
      };

      await expect(handler.execute(command)).rejects.toThrow('Task not found');
    });

    it('should throw if task is not active', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      const completedTask = task.complete();
      taskRepository.addTask(completedTask);

      const command: SkipTaskCommand = {
        taskId: completedTask.id,
        type: 'for_now'
      };

      await expect(handler.execute(command)).rejects.toThrow();
    });
  });
});
