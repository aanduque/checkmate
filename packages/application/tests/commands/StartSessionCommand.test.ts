import { describe, it, expect, beforeEach } from 'vitest';
import { StartSessionCommand, StartSessionHandler } from '../../src/commands/StartSessionCommand';
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

describe('StartSessionCommand', () => {
  let handler: StartSessionHandler;
  let taskRepository: InMemoryTaskRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    handler = new StartSessionHandler(taskRepository);
  });

  describe('execute', () => {
    it('should start a session for a task', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: StartSessionCommand = {
        taskId: task.id,
        durationMinutes: 25
      };
      const result = await handler.execute(command);

      expect(result.sessionId).toBeDefined();
      expect(result.taskId).toBe(task.id);
      expect(result.durationMinutes).toBe(25);
    });

    it('should persist task with new session', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: StartSessionCommand = {
        taskId: task.id,
        durationMinutes: 25
      };
      await handler.execute(command);

      const saved = await taskRepository.findById(task.id);
      expect(saved!.sessions.length).toBe(1);
    });

    it('should use default duration of 25 minutes', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const command: StartSessionCommand = {
        taskId: task.id
      };
      const result = await handler.execute(command);

      expect(result.durationMinutes).toBe(25);
    });

    it('should throw if task not found', async () => {
      const command: StartSessionCommand = {
        taskId: 'non-existent',
        durationMinutes: 25
      };

      await expect(handler.execute(command)).rejects.toThrow('Task not found');
    });

    it('should throw if task is not active', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      const completedTask = task.complete();
      taskRepository.addTask(completedTask);

      const command: StartSessionCommand = {
        taskId: completedTask.id,
        durationMinutes: 25
      };

      await expect(handler.execute(command)).rejects.toThrow('Cannot start session on inactive task');
    });

    it('should throw if task already has an active session', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      const { task: taskWithSession } = task.startSession(25);
      taskRepository.addTask(taskWithSession);

      const command: StartSessionCommand = {
        taskId: taskWithSession.id,
        durationMinutes: 25
      };

      await expect(handler.execute(command)).rejects.toThrow('Task already has an active session');
    });
  });
});
