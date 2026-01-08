/**
 * Stats RPC Methods - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RpcServer } from '../../rpc/RpcServer';
import { registerStatsMethods, StatsMethodHandlers } from '../statsMethods';
import { ITaskRepository, Task, StatsCalculator } from '@checkmate/domain';
import { GetStatsHandler } from '@checkmate/application';

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

  async findByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.status === status);
  }

  async findBySprint(sprintId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.sprintId === sprintId);
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }
}

describe('Stats RPC Methods', () => {
  let rpcServer: RpcServer;
  let repository: InMemoryTaskRepository;
  let handlers: StatsMethodHandlers;

  beforeEach(() => {
    rpcServer = new RpcServer();
    repository = new InMemoryTaskRepository();
    const statsCalculator = new StatsCalculator();
    handlers = {
      getStatsHandler: new GetStatsHandler(repository, statsCalculator)
    };
    registerStatsMethods(rpcServer, handlers);
  });

  describe('stats.getDaily', () => {
    it('should return daily stats', async () => {
      const result = await rpcServer.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'stats.getDaily',
        params: {}
      });

      expect(result.result).toHaveProperty('tasksCompleted');
      expect(result.result).toHaveProperty('pointsCompleted');
      expect(result.result).toHaveProperty('focusTimeSeconds');
      expect(result.result).toHaveProperty('sessionsCount');
    });
  });

  describe('stats.getWeekly', () => {
    it('should return weekly stats', async () => {
      const result = await rpcServer.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'stats.getWeekly',
        params: {}
      });

      expect(result.result).toHaveProperty('tasksCompleted');
      expect(result.result).toHaveProperty('pointsCompleted');
      expect(result.result).toHaveProperty('dailyActivity');
      expect(result.result).toHaveProperty('pointsByTag');
    });
  });
});
