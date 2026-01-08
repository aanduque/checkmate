/**
 * MoveTaskToSprintCommand Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MoveTaskToSprintHandler, MoveTaskToSprintCommand } from '../../src/commands/MoveTaskToSprintCommand';
import { Task, ITaskRepository, ISprintRepository, Sprint, TaskLocation } from '@checkmate/domain';

// In-memory repository implementations for testing
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

class InMemorySprintRepository implements ISprintRepository {
  private sprints: Map<string, Sprint> = new Map();

  async save(sprint: Sprint): Promise<void> {
    this.sprints.set(sprint.id, sprint);
  }

  async findById(id: string): Promise<Sprint | null> {
    return this.sprints.get(id) || null;
  }

  async findAll(): Promise<Sprint[]> {
    return Array.from(this.sprints.values());
  }

  async findByDateRange(start: Date, end: Date): Promise<Sprint[]> {
    return Array.from(this.sprints.values()).filter(s =>
      s.startDate >= start && s.endDate <= end
    );
  }

  async findCurrent(today: Date): Promise<Sprint | null> {
    return Array.from(this.sprints.values()).find(s => s.isActive(today)) || null;
  }

  async delete(id: string): Promise<void> {
    this.sprints.delete(id);
  }

  addSprint(sprint: Sprint): void {
    this.sprints.set(sprint.id, sprint);
  }
}

describe('MoveTaskToSprintCommand', () => {
  let handler: MoveTaskToSprintHandler;
  let taskRepository: InMemoryTaskRepository;
  let sprintRepository: InMemorySprintRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    sprintRepository = new InMemorySprintRepository();
    handler = new MoveTaskToSprintHandler(taskRepository, sprintRepository);
  });

  const createTask = () => Task.create({
    title: 'Test Task',
    tagPoints: { 'tag-1': 3 }
  });

  const createSprint = () => Sprint.create(new Date('2025-01-12')); // Sunday

  describe('successful move', () => {
    it('should move task from backlog to sprint', async () => {
      const task = createTask();
      const sprint = createSprint();
      taskRepository.addTask(task);
      sprintRepository.addSprint(sprint);

      const result = await handler.execute({
        taskId: task.id,
        sprintId: sprint.id
      });

      expect(result.location).toBe('sprint');
      expect(result.sprintId).toBe(sprint.id);
    });

    it('should persist the updated task', async () => {
      const task = createTask();
      const sprint = createSprint();
      taskRepository.addTask(task);
      sprintRepository.addSprint(sprint);

      await handler.execute({
        taskId: task.id,
        sprintId: sprint.id
      });

      const saved = await taskRepository.findById(task.id);
      expect(saved!.location.sprintId).toBe(sprint.id);
    });

    it('should return the task id in result', async () => {
      const task = createTask();
      const sprint = createSprint();
      taskRepository.addTask(task);
      sprintRepository.addSprint(sprint);

      const result = await handler.execute({
        taskId: task.id,
        sprintId: sprint.id
      });

      expect(result.taskId).toBe(task.id);
    });
  });

  describe('validation errors', () => {
    it('should throw if task not found', async () => {
      const sprint = createSprint();
      sprintRepository.addSprint(sprint);

      await expect(handler.execute({
        taskId: 'non-existent',
        sprintId: sprint.id
      })).rejects.toThrow('Task not found');
    });

    it('should throw if sprint not found', async () => {
      const task = createTask();
      taskRepository.addTask(task);

      await expect(handler.execute({
        taskId: task.id,
        sprintId: 'non-existent'
      })).rejects.toThrow('Sprint not found');
    });

    it('should throw if task is a recurring template', async () => {
      const template = Task.create({
        title: 'Recurring Task',
        tagPoints: { 'tag-1': 3 },
        recurrence: 'FREQ=DAILY'
      });
      const sprint = createSprint();
      taskRepository.addTask(template);
      sprintRepository.addSprint(sprint);

      await expect(handler.execute({
        taskId: template.id,
        sprintId: sprint.id
      })).rejects.toThrow('Cannot move recurring template to sprint');
    });

    it('should throw if task is not active', async () => {
      const task = createTask().complete();
      const sprint = createSprint();
      taskRepository.addTask(task);
      sprintRepository.addSprint(sprint);

      await expect(handler.execute({
        taskId: task.id,
        sprintId: sprint.id
      })).rejects.toThrow('Cannot move inactive task');
    });
  });

  describe('moving between sprints', () => {
    it('should allow moving from one sprint to another', async () => {
      const sprint1 = createSprint();
      const sprint2 = Sprint.create(new Date('2025-01-19')); // Next Sunday

      const task = createTask().moveToSprint(sprint1.id);
      taskRepository.addTask(task);
      sprintRepository.addSprint(sprint1);
      sprintRepository.addSprint(sprint2);

      const result = await handler.execute({
        taskId: task.id,
        sprintId: sprint2.id
      });

      expect(result.sprintId).toBe(sprint2.id);
    });
  });
});
