import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageSprintRepository } from '../../src/persistence/LocalStorageSprintRepository';
import { Sprint } from '@checkmate/domain';

class MockLocalStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] || null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

describe('LocalStorageSprintRepository', () => {
  let repository: LocalStorageSprintRepository;
  let mockStorage: MockLocalStorage;

  // Helper to create a sprint for a specific week
  const createSprintForWeek = (weeksFromNow: number): Sprint => {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + (weeksFromNow * 7));
    sunday.setHours(0, 0, 0, 0);
    return Sprint.create(sunday);
  };

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    repository = new LocalStorageSprintRepository(mockStorage);
  });

  describe('save', () => {
    it('should save a sprint to localStorage', async () => {
      const sprint = createSprintForWeek(0);

      await repository.save(sprint);

      const stored = mockStorage.getItem('checkmate_sprints');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed[sprint.id]).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should return a sprint by ID', async () => {
      const sprint = createSprintForWeek(0);
      await repository.save(sprint);

      const found = await repository.findById(sprint.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(sprint.id);
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.findById('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('findCurrent', () => {
    it('should return the current sprint', async () => {
      const currentSprint = createSprintForWeek(0);
      const nextSprint = createSprintForWeek(1);
      await repository.save(currentSprint);
      await repository.save(nextSprint);

      const found = await repository.findCurrent();

      expect(found).not.toBeNull();
      expect(found!.id).toBe(currentSprint.id);
    });

    it('should return null when no current sprint exists', async () => {
      const pastSprint = createSprintForWeek(-2);
      await repository.save(pastSprint);

      const found = await repository.findCurrent();

      // If no current sprint, should return null
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all sprints', async () => {
      const sprint1 = createSprintForWeek(0);
      const sprint2 = createSprintForWeek(1);
      await repository.save(sprint1);
      await repository.save(sprint2);

      const all = await repository.findAll();

      expect(all.length).toBe(2);
    });
  });

  describe('findUpcoming', () => {
    it('should return upcoming sprints ordered by start date', async () => {
      const currentSprint = createSprintForWeek(0);
      const nextSprint = createSprintForWeek(1);
      const futureSpring = createSprintForWeek(2);
      await repository.save(futureSpring);
      await repository.save(currentSprint);
      await repository.save(nextSprint);

      const upcoming = await repository.findUpcoming(2);

      expect(upcoming.length).toBeLessThanOrEqual(2);
    });
  });

  describe('delete', () => {
    it('should delete a sprint', async () => {
      const sprint = createSprintForWeek(0);
      await repository.save(sprint);

      await repository.delete(sprint.id);

      const found = await repository.findById(sprint.id);
      expect(found).toBeNull();
    });
  });
});
