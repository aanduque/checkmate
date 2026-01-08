/**
 * GetCurrentSprintQuery - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GetCurrentSprintHandler } from '../GetCurrentSprintQuery';
import { Sprint, ISprintRepository } from '@checkmate/domain';

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

describe('GetCurrentSprintHandler', () => {
  let handler: GetCurrentSprintHandler;
  let repository: InMemorySprintRepository;

  beforeEach(() => {
    repository = new InMemorySprintRepository();
    handler = new GetCurrentSprintHandler(repository);
  });

  it('should return null when no sprints exist', async () => {
    const result = await handler.execute();

    expect(result).toBeNull();
  });

  it('should return current sprint when one is active', async () => {
    // Create a sprint starting on the most recent Sunday
    const sunday = getPreviousSunday();
    const sprint = Sprint.create(sunday);
    await repository.save(sprint);

    const result = await handler.execute();

    expect(result).not.toBeNull();
    expect(result!.id).toBe(sprint.id);
  });

  it('should return null when sprint is in the past', async () => {
    // Create a sprint from 2 weeks ago (now expired)
    const oldSunday = new Date();
    oldSunday.setDate(oldSunday.getDate() - 14 - oldSunday.getDay());
    oldSunday.setHours(0, 0, 0, 0);
    const sprint = Sprint.create(oldSunday);
    await repository.save(sprint);

    const result = await handler.execute();

    expect(result).toBeNull();
  });
});
