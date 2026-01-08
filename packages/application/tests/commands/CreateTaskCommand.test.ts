import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTaskCommand, CreateTaskHandler } from '../../src/commands/CreateTaskCommand';
import { ITaskRepository, Task, TaskLocation } from '@checkmate/domain';

// In-memory repository for testing
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
}

describe('CreateTaskCommand', () => {
  let handler: CreateTaskHandler;
  let taskRepository: InMemoryTaskRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    handler = new CreateTaskHandler(taskRepository);
  });

  describe('execute', () => {
    it('should create a task with title and tag points', async () => {
      const command: CreateTaskCommand = {
        title: 'Test Task',
        tagPoints: { 'tag-1': 3 }
      };

      const result = await handler.execute(command);

      expect(result.id).toBeDefined();
      expect(result.title).toBe('Test Task');
      expect(result.tagPoints['tag-1']).toBe(3);
    });

    it('should persist the task to repository', async () => {
      const command: CreateTaskCommand = {
        title: 'Persisted Task',
        tagPoints: { 'tag-1': 5 }
      };

      const result = await handler.execute(command);
      const saved = await taskRepository.findById(result.id);

      expect(saved).not.toBeNull();
      expect(saved!.title).toBe('Persisted Task');
    });

    it('should create task in backlog by default', async () => {
      const command: CreateTaskCommand = {
        title: 'Backlog Task',
        tagPoints: { 'tag-1': 1 }
      };

      const result = await handler.execute(command);

      expect(result.location).toBe('backlog');
    });

    it('should create task in specified sprint', async () => {
      const command: CreateTaskCommand = {
        title: 'Sprint Task',
        tagPoints: { 'tag-1': 2 },
        sprintId: 'sprint-123'
      };

      const result = await handler.execute(command);

      expect(result.location).toBe('sprint');
      expect(result.sprintId).toBe('sprint-123');
    });

    it('should validate Fibonacci points', async () => {
      const command: CreateTaskCommand = {
        title: 'Invalid Points Task',
        tagPoints: { 'tag-1': 4 } // 4 is not Fibonacci
      };

      await expect(handler.execute(command)).rejects.toThrow('Points must be a valid Fibonacci number');
    });

    it('should create task with multiple tag points', async () => {
      const command: CreateTaskCommand = {
        title: 'Multi-tag Task',
        tagPoints: {
          'work': 5,
          'dev': 3
        }
      };

      const result = await handler.execute(command);

      expect(result.tagPoints['work']).toBe(5);
      expect(result.tagPoints['dev']).toBe(3);
      expect(result.totalPoints).toBe(8);
    });
  });
});
