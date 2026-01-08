/**
 * AddManualSessionCommand Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AddManualSessionHandler, AddManualSessionCommand } from '../../src/commands/AddManualSessionCommand';
import { Task, ITaskRepository, TaskLocation } from '@checkmate/domain';

// In-memory repository implementation for testing
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

  async findByParentId(parentId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.parentId === parentId);
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  addTask(task: Task): void {
    this.tasks.set(task.id, task);
  }
}

describe('AddManualSessionCommand', () => {
  let handler: AddManualSessionHandler;
  let taskRepository: InMemoryTaskRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    handler = new AddManualSessionHandler(taskRepository);
  });

  const createTask = () => Task.create({
    title: 'Test Task',
    tagPoints: { 'tag-1': 3 }
  });

  describe('successful creation', () => {
    it('should add a manual session to task', async () => {
      const task = createTask();
      taskRepository.addTask(task);

      const startedAt = new Date('2025-01-10T10:00:00Z');
      const endedAt = new Date('2025-01-10T10:30:00Z');

      const result = await handler.execute({
        taskId: task.id,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        focusLevel: 'focused'
      });

      expect(result.taskId).toBe(task.id);
      expect(result.sessionId).toBeDefined();
      expect(result.isManual).toBe(true);
      expect(result.durationSeconds).toBe(1800); // 30 minutes = 1800 seconds
    });

    it('should persist the session with the task', async () => {
      const task = createTask();
      taskRepository.addTask(task);

      const startedAt = new Date('2025-01-10T10:00:00Z');
      const endedAt = new Date('2025-01-10T10:25:00Z');

      await handler.execute({
        taskId: task.id,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        focusLevel: 'neutral'
      });

      const saved = await taskRepository.findById(task.id);
      expect(saved!.sessions).toHaveLength(1);
      expect(saved!.sessions[0].isManual).toBe(true);
      expect(saved!.sessions[0].focusLevel?.value).toBe('neutral');
    });

    it('should allow adding a note', async () => {
      const task = createTask();
      taskRepository.addTask(task);

      const startedAt = new Date('2025-01-10T10:00:00Z');
      const endedAt = new Date('2025-01-10T10:30:00Z');

      const result = await handler.execute({
        taskId: task.id,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        focusLevel: 'focused',
        note: 'Worked on the refactor'
      });

      const saved = await taskRepository.findById(task.id);
      expect(saved!.sessions[0].note).toBe('Worked on the refactor');
    });
  });

  describe('validation errors', () => {
    it('should throw if task not found', async () => {
      await expect(handler.execute({
        taskId: 'non-existent',
        startedAt: new Date().toISOString(),
        endedAt: new Date().toISOString(),
        focusLevel: 'focused'
      })).rejects.toThrow('Task not found');
    });

    it('should throw if end time is before start time', async () => {
      const task = createTask();
      taskRepository.addTask(task);

      const startedAt = new Date('2025-01-10T10:30:00Z');
      const endedAt = new Date('2025-01-10T10:00:00Z'); // Before start

      await expect(handler.execute({
        taskId: task.id,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        focusLevel: 'focused'
      })).rejects.toThrow('End time must be after start time');
    });

    it('should throw if task is not active', async () => {
      const task = createTask().complete();
      taskRepository.addTask(task);

      const startedAt = new Date('2025-01-10T10:00:00Z');
      const endedAt = new Date('2025-01-10T10:30:00Z');

      await expect(handler.execute({
        taskId: task.id,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
        focusLevel: 'focused'
      })).rejects.toThrow('Cannot add session to inactive task');
    });
  });
});
