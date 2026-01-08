import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LocalStorageTaskRepository } from '../../src/persistence/LocalStorageTaskRepository';
import { Task, TaskLocation } from '@checkmate/domain';

// Mock localStorage for Node.js tests
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

describe('LocalStorageTaskRepository', () => {
  let repository: LocalStorageTaskRepository;
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    repository = new LocalStorageTaskRepository(mockStorage);
  });

  describe('save', () => {
    it('should save a task to localStorage', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });

      await repository.save(task);

      const stored = mockStorage.getItem('checkmate_tasks');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed[task.id]).toBeDefined();
      expect(parsed[task.id].title).toBe('Test Task');
    });

    it('should update an existing task', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      await repository.save(task);

      const updatedTask = task.updateTitle('Updated Title');
      await repository.save(updatedTask);

      const stored = mockStorage.getItem('checkmate_tasks');
      const parsed = JSON.parse(stored!);
      expect(Object.keys(parsed).length).toBe(1);
      expect(parsed[task.id].title).toBe('Updated Title');
    });
  });

  describe('findById', () => {
    it('should return a task by ID', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      await repository.save(task);

      const found = await repository.findById(task.id);

      expect(found).not.toBeNull();
      expect(found!.title).toBe('Test Task');
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.findById('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all tasks', async () => {
      const task1 = Task.create({ title: 'Task 1', tagPoints: { 'tag-1': 1 } });
      const task2 = Task.create({ title: 'Task 2', tagPoints: { 'tag-1': 2 } });
      await repository.save(task1);
      await repository.save(task2);

      const all = await repository.findAll();

      expect(all.length).toBe(2);
    });

    it('should return empty array when no tasks exist', async () => {
      const all = await repository.findAll();

      expect(all).toEqual([]);
    });
  });

  describe('findByLocation', () => {
    it('should find tasks in backlog', async () => {
      const backlogTask = Task.create({ title: 'Backlog Task', tagPoints: { 'tag-1': 1 } });
      const sprintTask = Task.create({ title: 'Sprint Task', tagPoints: { 'tag-1': 2 } }).moveToSprint('sprint-1');
      await repository.save(backlogTask);
      await repository.save(sprintTask);

      const found = await repository.findByLocation(TaskLocation.backlog());

      expect(found.length).toBe(1);
      expect(found[0].title).toBe('Backlog Task');
    });

    it('should find tasks in a specific sprint', async () => {
      const task1 = Task.create({ title: 'Sprint 1 Task', tagPoints: { 'tag-1': 1 } }).moveToSprint('sprint-1');
      const task2 = Task.create({ title: 'Sprint 2 Task', tagPoints: { 'tag-1': 2 } }).moveToSprint('sprint-2');
      await repository.save(task1);
      await repository.save(task2);

      const found = await repository.findByLocation(TaskLocation.sprint('sprint-1'));

      expect(found.length).toBe(1);
      expect(found[0].title).toBe('Sprint 1 Task');
    });
  });

  describe('findActive', () => {
    it('should find only active tasks', async () => {
      const activeTask = Task.create({ title: 'Active', tagPoints: { 'tag-1': 1 } });
      const completedTask = Task.create({ title: 'Completed', tagPoints: { 'tag-1': 2 } }).complete();
      await repository.save(activeTask);
      await repository.save(completedTask);

      const found = await repository.findActive();

      expect(found.length).toBe(1);
      expect(found[0].title).toBe('Active');
    });
  });

  describe('findCompleted', () => {
    it('should find only completed tasks', async () => {
      const activeTask = Task.create({ title: 'Active', tagPoints: { 'tag-1': 1 } });
      const completedTask = Task.create({ title: 'Completed', tagPoints: { 'tag-1': 2 } }).complete();
      await repository.save(activeTask);
      await repository.save(completedTask);

      const found = await repository.findCompleted();

      expect(found.length).toBe(1);
      expect(found[0].title).toBe('Completed');
    });
  });

  describe('findTemplates', () => {
    it('should find only recurring templates', async () => {
      const template = Task.create({ title: 'Template', tagPoints: { 'tag-1': 1 }, recurrence: 'FREQ=DAILY' });
      const regularTask = Task.create({ title: 'Regular', tagPoints: { 'tag-1': 2 } });
      await repository.save(template);
      await repository.save(regularTask);

      const found = await repository.findTemplates();

      expect(found.length).toBe(1);
      expect(found[0].title).toBe('Template');
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      const task = Task.create({ title: 'Test Task', tagPoints: { 'tag-1': 3 } });
      await repository.save(task);

      await repository.delete(task.id);

      const found = await repository.findById(task.id);
      expect(found).toBeNull();
    });

    it('should not throw when deleting non-existent task', async () => {
      await expect(repository.delete('non-existent')).resolves.toBeUndefined();
    });
  });
});
