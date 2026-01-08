/**
 * CreateSprintCommand - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CreateSprintHandler } from '../CreateSprintCommand';
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

// Use noon UTC to avoid timezone day-shift issues
// January 5, 2025 is a Sunday
const SUNDAY_ISO = '2025-01-05T12:00:00.000Z';
const MONDAY_ISO = '2025-01-06T12:00:00.000Z';

describe('CreateSprintHandler', () => {
  let handler: CreateSprintHandler;
  let repository: InMemorySprintRepository;

  beforeEach(() => {
    repository = new InMemorySprintRepository();
    handler = new CreateSprintHandler(repository);
  });

  it('should create a sprint starting on Sunday', async () => {
    const result = await handler.execute({
      startDate: SUNDAY_ISO
    });

    expect(result.id).toBeDefined();
    expect(result.startDate).toBeDefined();
    expect(result.endDate).toBeDefined();
  });

  it('should persist the sprint', async () => {
    const result = await handler.execute({
      startDate: SUNDAY_ISO
    });

    const saved = await repository.findById(result.id);
    expect(saved).not.toBeNull();
    expect(saved!.startDate).toBeInstanceOf(Date);
  });

  it('should automatically calculate end date as Saturday', async () => {
    const result = await handler.execute({
      startDate: SUNDAY_ISO
    });

    // End date should be 6 days after start (Saturday)
    const endDate = new Date(result.endDate);
    expect(endDate.getUTCDay()).toBe(6); // Saturday
  });

  it('should reject sprint not starting on Sunday', async () => {
    await expect(handler.execute({
      startDate: MONDAY_ISO
    })).rejects.toThrow('Sprint must start on a Sunday');
  });
});
