/**
 * taskMethods - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RpcServer } from '../../rpc/RpcServer';
import { registerTaskMethods } from '../taskMethods';
import {
  CreateTaskHandler,
  CompleteTaskHandler,
  CancelTaskHandler,
  SkipTaskHandler,
  GetKanbanBoardHandler,
  GetFocusTaskHandler
} from '@checkmate/application';
import {
  Task,
  Tag,
  Sprint,
  ITaskRepository,
  ISprintRepository,
  ITagRepository,
  TaskLocation,
  TaskOrderingService
} from '@checkmate/domain';

// In-memory test repositories
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

class InMemorySprintRepository implements ISprintRepository {
  private sprints: Map<string, Sprint> = new Map();

  async save(sprint: Sprint): Promise<void> {
    this.sprints.set(sprint.id, sprint);
  }

  async findById(id: string): Promise<Sprint | null> {
    return this.sprints.get(id) || null;
  }

  async findCurrent(): Promise<Sprint | null> {
    const now = new Date();
    return Array.from(this.sprints.values()).find(s => s.isActive(now)) || null;
  }

  async findAll(): Promise<Sprint[]> {
    return Array.from(this.sprints.values());
  }

  async findUpcoming(limit?: number): Promise<Sprint[]> {
    const now = new Date();
    const upcoming = Array.from(this.sprints.values())
      .filter(s => s.startDate >= now || s.isActive(now))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    return limit ? upcoming.slice(0, limit) : upcoming;
  }

  async delete(id: string): Promise<void> {
    this.sprints.delete(id);
  }
}

class InMemoryTagRepository implements ITagRepository {
  private tags: Map<string, Tag> = new Map();

  async save(tag: Tag): Promise<void> {
    this.tags.set(tag.id, tag);
  }

  async findById(id: string): Promise<Tag | null> {
    return this.tags.get(id) || null;
  }

  async findByName(name: string): Promise<Tag | null> {
    const lowerName = name.toLowerCase();
    return Array.from(this.tags.values()).find(t =>
      t.name.toLowerCase() === lowerName
    ) || null;
  }

  async findAll(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async delete(id: string): Promise<void> {
    this.tags.delete(id);
  }
}

describe('taskMethods', () => {
  let rpcServer: RpcServer;
  let taskRepository: InMemoryTaskRepository;
  let sprintRepository: InMemorySprintRepository;
  let tagRepository: InMemoryTagRepository;

  beforeEach(async () => {
    rpcServer = new RpcServer();
    taskRepository = new InMemoryTaskRepository();
    sprintRepository = new InMemorySprintRepository();
    tagRepository = new InMemoryTagRepository();

    // Create test tag
    const tag = Tag.create({
      name: 'Work',
      icon: '💼',
      color: '#3b82f6',
      defaultCapacity: 21
    });
    await tagRepository.save(tag);

    // Register methods
    const orderingService = new TaskOrderingService();
    registerTaskMethods(rpcServer, {
      createTaskHandler: new CreateTaskHandler(taskRepository),
      completeTaskHandler: new CompleteTaskHandler(taskRepository),
      cancelTaskHandler: new CancelTaskHandler(taskRepository),
      skipTaskHandler: new SkipTaskHandler(taskRepository),
      getKanbanBoardHandler: new GetKanbanBoardHandler(taskRepository, sprintRepository, tagRepository),
      getFocusTaskHandler: new GetFocusTaskHandler(taskRepository, orderingService)
    });
  });

  describe('task.create', () => {
    it('should create a task', async () => {
      const response = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'task.create',
        params: {
          title: 'New Task',
          tagPoints: { work: 5 }
        },
        id: 1
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toMatchObject({
        title: 'New Task',
        totalPoints: 5
      });
    });
  });

  describe('task.complete', () => {
    it('should complete a task', async () => {
      // Create task first
      const createResponse = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'task.create',
        params: { title: 'Task to Complete', tagPoints: { work: 3 } },
        id: 1
      });

      const taskId = (createResponse.result as { id: string }).id;

      // Complete it
      const completeResponse = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'task.complete',
        params: { id: taskId },
        id: 2
      });

      expect(completeResponse.error).toBeUndefined();
      expect(completeResponse.result).toMatchObject({
        status: 'completed'
      });
    });
  });

  describe('task.cancel', () => {
    it('should cancel a task with justification', async () => {
      // Create task first
      const createResponse = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'task.create',
        params: { title: 'Task to Cancel', tagPoints: { work: 3 } },
        id: 1
      });

      const taskId = (createResponse.result as { id: string }).id;

      // Cancel it
      const cancelResponse = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'task.cancel',
        params: {
          id: taskId,
          justification: 'No longer needed'
        },
        id: 2
      });

      expect(cancelResponse.error).toBeUndefined();
      expect(cancelResponse.result).toMatchObject({
        status: 'canceled'
      });
    });
  });

  describe('task.skip', () => {
    it('should skip a task for now', async () => {
      // Create task first
      const createResponse = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'task.create',
        params: { title: 'Task to Skip', tagPoints: { work: 3 } },
        id: 1
      });

      const taskId = (createResponse.result as { id: string }).id;

      // Skip it
      const skipResponse = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'task.skip',
        params: {
          id: taskId,
          type: 'for_now',
          justification: 'Need more info'
        },
        id: 2
      });

      expect(skipResponse.error).toBeUndefined();
      const result = skipResponse.result as { id: string; skipState: { type: string } };
      expect(result.skipState.type).toBe('for_now');
    });
  });

  describe('task.getKanban', () => {
    it('should return kanban board data', async () => {
      // Create some tasks
      await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'task.create',
        params: { title: 'Backlog Task', tagPoints: { work: 3 } },
        id: 1
      });

      const response = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'task.getKanban',
        params: {},
        id: 2
      });

      expect(response.error).toBeUndefined();
      const result = response.result as { backlog: unknown[]; sprint: unknown[]; completed: unknown[] };
      expect(result).toHaveProperty('backlog');
      expect(result).toHaveProperty('sprint');
      expect(result).toHaveProperty('completed');
      expect(result.backlog).toHaveLength(1);
    });
  });

  describe('task.getFocus', () => {
    it('should return focus task data with empty sprint', async () => {
      // Test getFocus with a non-existent sprint (returns empty results)
      const response = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'task.getFocus',
        params: { sprintId: 'nonexistent_sprint' },
        id: 1
      });

      expect(response.error).toBeUndefined();
      const result = response.result as { focusTask: null; upNext: unknown[]; hiddenCount: number };
      expect(result.focusTask).toBeNull();
      expect(result.upNext).toEqual([]);
      expect(result.hiddenCount).toBe(0);
    });
  });
});
