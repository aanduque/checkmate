import { describe, it, expect, beforeEach } from 'vitest';
import { CancelTaskCommand, CancelTaskHandler } from '../../src/commands/CancelTaskCommand';
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

describe('CancelTaskCommand', () => {
  let handler: CancelTaskHandler;
  let taskRepository: InMemoryTaskRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    handler = new CancelTaskHandler(taskRepository);
  });

  describe('execute', () => {
    it('should cancel an active task with justification', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: CancelTaskCommand = {
        taskId: task.id,
        justification: 'No longer needed'
      };
      const result = await handler.execute(command);

      expect(result.status).toBe('canceled');
      expect(result.canceledAt).toBeDefined();
    });

    it('should create a justification comment in the task', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: CancelTaskCommand = {
        taskId: task.id,
        justification: 'No longer needed'
      };
      await handler.execute(command);

      const saved = await taskRepository.findById(task.id);
      expect(saved!.comments.length).toBe(1);
      expect(saved!.comments[0].content).toBe('No longer needed');
      expect(saved!.comments[0].isCancelJustification).toBe(true);
    });

    it('should require justification', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: CancelTaskCommand = {
        taskId: task.id,
        justification: ''
      };

      await expect(handler.execute(command)).rejects.toThrow();
    });

    it('should throw if task not found', async () => {
      const command: CancelTaskCommand = {
        taskId: 'non-existent',
        justification: 'Reason'
      };

      await expect(handler.execute(command)).rejects.toThrow('Task not found');
    });

    it('should persist the canceled task', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: CancelTaskCommand = {
        taskId: task.id,
        justification: 'Reason for cancellation'
      };
      await handler.execute(command);

      const savedTask = await taskRepository.findById(task.id);
      expect(savedTask!.status.isCanceled()).toBe(true);
    });
  });
});
