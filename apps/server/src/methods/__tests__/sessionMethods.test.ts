/**
 * sessionMethods - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RpcServer } from '../../rpc/RpcServer';
import { registerSessionMethods } from '../sessionMethods';
import {
  StartSessionHandler,
  EndSessionHandler
} from '@checkmate/application';
import {
  Task,
  ITaskRepository,
  TaskLocation
} from '@checkmate/domain';

// In-memory test repository
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

describe('sessionMethods', () => {
  let rpcServer: RpcServer;
  let taskRepository: InMemoryTaskRepository;
  let testTask: Task;

  beforeEach(async () => {
    rpcServer = new RpcServer();
    taskRepository = new InMemoryTaskRepository();

    // Create a test task
    testTask = Task.create({
      title: 'Test Task',
      tagPoints: { work: 5 }
    });
    await taskRepository.save(testTask);

    // Register methods
    registerSessionMethods(rpcServer, {
      startSessionHandler: new StartSessionHandler(taskRepository),
      endSessionHandler: new EndSessionHandler(taskRepository)
    });
  });

  describe('session.start', () => {
    it('should start a session on a task', async () => {
      const response = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'session.start',
        params: {
          taskId: testTask.id,
          durationMinutes: 25
        },
        id: 1
      });

      expect(response.error).toBeUndefined();
      const result = response.result as { sessionId: string; taskId: string };
      expect(result.taskId).toBe(testTask.id);
      expect(result.sessionId).toBeDefined();
    });
  });

  describe('session.end', () => {
    it('should end an active session', async () => {
      // Start a session first
      const startResponse = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'session.start',
        params: {
          taskId: testTask.id,
          durationMinutes: 25
        },
        id: 1
      });

      const { sessionId } = startResponse.result as { sessionId: string };

      // End the session
      const endResponse = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'session.end',
        params: {
          taskId: testTask.id,
          sessionId,
          focusLevel: 'focused'
        },
        id: 2
      });

      expect(endResponse.error).toBeUndefined();
      const result = endResponse.result as { sessionId: string; status: string };
      expect(result.status).toBe('completed');
    });
  });
});
