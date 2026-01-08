/**
 * GetUpcomingSprintsQuery - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GetUpcomingSprintsHandler } from '../GetUpcomingSprintsQuery';
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

// Helper to get the next Sunday
function getNextSunday(): Date {
  const sunday = getPreviousSunday();
  sunday.setDate(sunday.getDate() + 7);
  return sunday;
}

describe('GetUpcomingSprintsHandler', () => {
  let handler: GetUpcomingSprintsHandler;
  let repository: InMemorySprintRepository;

  beforeEach(() => {
    repository = new InMemorySprintRepository();
    handler = new GetUpcomingSprintsHandler(repository);
  });

  it('should return empty array when no sprints exist', async () => {
    const result = await handler.execute();

    expect(result).toEqual([]);
  });

  it('should return upcoming sprints', async () => {
    const currentSunday = getPreviousSunday();
    const nextSunday = getNextSunday();

    const sprint1 = Sprint.create(currentSunday);
    const sprint2 = Sprint.create(nextSunday);

    await repository.save(sprint1);
    await repository.save(sprint2);

    const result = await handler.execute();

    expect(result.length).toBe(2);
  });

  it('should respect limit parameter', async () => {
    const currentSunday = getPreviousSunday();
    const nextSunday = getNextSunday();

    const sprint1 = Sprint.create(currentSunday);
    const sprint2 = Sprint.create(nextSunday);

    await repository.save(sprint1);
    await repository.save(sprint2);

    const result = await handler.execute({ limit: 1 });

    expect(result.length).toBe(1);
  });

  it('should return sprints sorted by start date', async () => {
    const nextSunday = getNextSunday();
    const currentSunday = getPreviousSunday();

    // Save in reverse order
    const sprint2 = Sprint.create(nextSunday);
    const sprint1 = Sprint.create(currentSunday);

    await repository.save(sprint2);
    await repository.save(sprint1);

    const result = await handler.execute();

    expect(new Date(result[0].startDate).getTime())
      .toBeLessThan(new Date(result[1].startDate).getTime());
  });
});
