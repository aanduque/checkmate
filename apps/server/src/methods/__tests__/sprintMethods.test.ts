/**
 * Sprint RPC Methods - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RpcServer } from '../../rpc/RpcServer';
import { registerSprintMethods, SprintMethodHandlers } from '../sprintMethods';
import { ISprintRepository, Sprint } from '@checkmate/domain';
import {
  CreateSprintHandler,
  GetCurrentSprintHandler,
  GetUpcomingSprintsHandler
} from '@checkmate/application';

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

// Helper to get the previous Sunday
function getPreviousSunday(): Date {
  const now = new Date();
  const day = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - day);
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

describe('Sprint RPC Methods', () => {
  let rpcServer: RpcServer;
  let repository: InMemorySprintRepository;
  let handlers: SprintMethodHandlers;

  beforeEach(() => {
    rpcServer = new RpcServer();
    repository = new InMemorySprintRepository();
    handlers = {
      createSprintHandler: new CreateSprintHandler(repository),
      getCurrentSprintHandler: new GetCurrentSprintHandler(repository),
      getUpcomingSprintsHandler: new GetUpcomingSprintsHandler(repository)
    };
    registerSprintMethods(rpcServer, handlers);
  });

  describe('sprint.create', () => {
    it('should create a sprint starting on Sunday', async () => {
      const sunday = getPreviousSunday();

      const result = await rpcServer.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'sprint.create',
        params: { startDate: sunday.toISOString() }
      });

      expect(result.result).toHaveProperty('id');
      expect(result.result).toHaveProperty('startDate');
      expect(result.result).toHaveProperty('endDate');
    });

    it('should reject sprint not starting on Sunday', async () => {
      const monday = new Date();
      monday.setDate(monday.getDate() - monday.getDay() + 1); // Monday
      monday.setHours(12, 0, 0, 0);

      const result = await rpcServer.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'sprint.create',
        params: { startDate: monday.toISOString() }
      });

      expect(result.error).toBeDefined();
      expect(result.error!.message).toContain('Sunday');
    });
  });

  describe('sprint.getCurrent', () => {
    it('should return null when no current sprint', async () => {
      const result = await rpcServer.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'sprint.getCurrent',
        params: {}
      });

      expect(result.result).toBeNull();
    });

    it('should return current sprint', async () => {
      // Create current sprint first
      const sunday = getPreviousSunday();
      await rpcServer.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'sprint.create',
        params: { startDate: sunday.toISOString() }
      });

      const result = await rpcServer.handle({
        jsonrpc: '2.0',
        id: 2,
        method: 'sprint.getCurrent',
        params: {}
      });

      expect(result.result).not.toBeNull();
      expect(result.result).toHaveProperty('id');
    });
  });

  describe('sprint.getUpcoming', () => {
    it('should return empty array when no sprints', async () => {
      const result = await rpcServer.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'sprint.getUpcoming',
        params: {}
      });

      expect(result.result).toEqual([]);
    });

    it('should return upcoming sprints with limit', async () => {
      const sunday = getPreviousSunday();
      await rpcServer.handle({
        jsonrpc: '2.0',
        id: 1,
        method: 'sprint.create',
        params: { startDate: sunday.toISOString() }
      });

      const result = await rpcServer.handle({
        jsonrpc: '2.0',
        id: 2,
        method: 'sprint.getUpcoming',
        params: { limit: 5 }
      });

      expect(Array.isArray(result.result)).toBe(true);
      expect(result.result.length).toBeLessThanOrEqual(5);
    });
  });
});
