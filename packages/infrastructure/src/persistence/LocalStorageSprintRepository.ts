/**
 * LocalStorageSprintRepository - Persists sprints to localStorage
 */

import { ISprintRepository, Sprint, SprintObject } from '@checkmate/domain';

const STORAGE_KEY = 'checkmate_sprints';

export class LocalStorageSprintRepository implements ISprintRepository {
  constructor(private readonly storage: Storage) {}

  private loadAll(): Record<string, SprintObject> {
    const data = this.storage.getItem(STORAGE_KEY);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private saveAll(sprints: Record<string, SprintObject>): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(sprints));
  }

  async save(sprint: Sprint): Promise<void> {
    const sprints = this.loadAll();
    sprints[sprint.id] = sprint.toObject();
    this.saveAll(sprints);
  }

  async findById(id: string): Promise<Sprint | null> {
    const sprints = this.loadAll();
    const sprintData = sprints[id];
    if (!sprintData) return null;
    return Sprint.fromObject(sprintData);
  }

  async findCurrent(): Promise<Sprint | null> {
    const all = await this.findAll();
    const now = new Date();
    return all.find(sprint => sprint.isActive(now)) || null;
  }

  async findAll(): Promise<Sprint[]> {
    const sprints = this.loadAll();
    return Object.values(sprints).map(data => Sprint.fromObject(data));
  }

  async findUpcoming(limit?: number): Promise<Sprint[]> {
    const all = await this.findAll();
    const now = new Date();

    // Filter to future sprints and sort by start date
    const upcoming = all
      .filter(sprint => sprint.startDate >= now || sprint.isActive(now))
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    return limit ? upcoming.slice(0, limit) : upcoming;
  }

  async delete(id: string): Promise<void> {
    const sprints = this.loadAll();
    delete sprints[id];
    this.saveAll(sprints);
  }
}
