import { describe, it, expect, beforeEach } from 'vitest';
import { CompleteTaskCommand, CompleteTaskHandler } from '../../src/commands/CompleteTaskCommand';
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

  // Helper method for tests
  addTask(task: Task): void {
    this.tasks.set(task.id, task);
  }
}

describe('CompleteTaskCommand', () => {
  let handler: CompleteTaskHandler;
  let taskRepository: InMemoryTaskRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    handler = new CompleteTaskHandler(taskRepository);
  });

  describe('execute', () => {
    it('should complete an active task', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: CompleteTaskCommand = { taskId: task.id };
      const result = await handler.execute(command);

      expect(result.status).toBe('completed');
      expect(result.completedAt).toBeDefined();
    });

    it('should persist the completed task', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: CompleteTaskCommand = { taskId: task.id };
      await handler.execute(command);

      const saved = await taskRepository.findById(task.id);
      expect(saved!.status.isCompleted()).toBe(true);
    });

    it('should throw if task not found', async () => {
      const command: CompleteTaskCommand = { taskId: 'non-existent' };

      await expect(handler.execute(command)).rejects.toThrow('Task not found');
    });

    it('should throw if task is already completed', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      const completedTask = task.complete();
      taskRepository.addTask(completedTask);

      const command: CompleteTaskCommand = { taskId: completedTask.id };

      await expect(handler.execute(command)).rejects.toThrow('Cannot complete a task that is not active');
    });
  });
});
