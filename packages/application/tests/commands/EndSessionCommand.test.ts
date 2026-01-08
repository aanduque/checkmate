import { describe, it, expect, beforeEach } from 'vitest';
import { EndSessionCommand, EndSessionHandler } from '../../src/commands/EndSessionCommand';
import { ITaskRepository, Task, TaskLocation, FocusLevel } from '@checkmate/domain';

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

describe('EndSessionCommand', () => {
  let handler: EndSessionHandler;
  let taskRepository: InMemoryTaskRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    handler = new EndSessionHandler(taskRepository);
  });

  describe('execute', () => {
    it('should end an active session with focus level', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      const { task: taskWithSession, sessionId } = task.startSession(25);
      taskRepository.addTask(taskWithSession);

      const command: EndSessionCommand = {
        taskId: taskWithSession.id,
        sessionId,
        focusLevel: 'focused'
      };
      const result = await handler.execute(command);

      expect(result.status).toBe('completed');
      expect(result.focusLevel).toBe('focused');
    });

    it('should persist the completed session', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      const { task: taskWithSession, sessionId } = task.startSession(25);
      taskRepository.addTask(taskWithSession);

      const command: EndSessionCommand = {
        taskId: taskWithSession.id,
        sessionId,
        focusLevel: 'neutral'
      };
      await handler.execute(command);

      const saved = await taskRepository.findById(taskWithSession.id);
      const session = saved!.sessions.find(s => s.id === sessionId);
      expect(session!.status.isCompleted()).toBe(true);
    });

    it('should accept different focus levels', async () => {
      const focusLevels: Array<'focused' | 'neutral' | 'distracted'> = ['focused', 'neutral', 'distracted'];

      for (const level of focusLevels) {
        const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
        const { task: taskWithSession, sessionId } = task.startSession(25);
        taskRepository.addTask(taskWithSession);

        const command: EndSessionCommand = {
          taskId: taskWithSession.id,
          sessionId,
          focusLevel: level
        };
        const result = await handler.execute(command);

        expect(result.focusLevel).toBe(level);
      }
    });

    it('should throw if task not found', async () => {
      const command: EndSessionCommand = {
        taskId: 'non-existent',
        sessionId: 'session-123',
        focusLevel: 'focused'
      };

      await expect(handler.execute(command)).rejects.toThrow('Task not found');
    });

    it('should throw if session not found', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      const { task: taskWithSession } = task.startSession(25);
      taskRepository.addTask(taskWithSession);

      const command: EndSessionCommand = {
        taskId: taskWithSession.id,
        sessionId: 'wrong-session-id',
        focusLevel: 'focused'
      };

      await expect(handler.execute(command)).rejects.toThrow('Session not found');
    });

    it('should throw if session is already completed', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      const { task: taskWithSession, sessionId } = task.startSession(25);
      const completedTask = taskWithSession.endSession(sessionId, FocusLevel.focused());
      taskRepository.addTask(completedTask);

      const command: EndSessionCommand = {
        taskId: completedTask.id,
        sessionId,
        focusLevel: 'focused'
      };

      await expect(handler.execute(command)).rejects.toThrow('Session is not active');
    });
  });
});
