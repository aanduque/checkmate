import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageTagRepository } from '../../src/persistence/LocalStorageTagRepository';
import { Tag } from '@checkmate/domain';

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

describe('LocalStorageTagRepository', () => {
  let repository: LocalStorageTagRepository;
  let mockStorage: MockLocalStorage;

  beforeEach(() => {
    mockStorage = new MockLocalStorage();
    repository = new LocalStorageTagRepository(mockStorage);
  });

  describe('save', () => {
    it('should save a tag to localStorage', async () => {
      const tag = Tag.create({ name: 'Work', icon: '💼', color: '#ff0000', defaultCapacity: 21 });

      await repository.save(tag);

      const stored = mockStorage.getItem('checkmate_tags');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed[tag.id]).toBeDefined();
      expect(parsed[tag.id].name).toBe('Work');
    });
  });

  describe('findById', () => {
    it('should return a tag by ID', async () => {
      const tag = Tag.create({ name: 'Work', icon: '💼', color: '#ff0000', defaultCapacity: 21 });
      await repository.save(tag);

      const found = await repository.findById(tag.id);

      expect(found).not.toBeNull();
      expect(found!.name).toBe('Work');
    });

    it('should return null for non-existent ID', async () => {
      const found = await repository.findById('non-existent');

      expect(found).toBeNull();
    });
  });

  describe('findByName', () => {
    it('should find tag by name case-insensitively', async () => {
      const tag = Tag.create({ name: 'Work', icon: '💼', color: '#ff0000', defaultCapacity: 21 });
      await repository.save(tag);

      const found = await repository.findByName('work');

      expect(found).not.toBeNull();
      expect(found!.name).toBe('Work');
    });

    it('should return null when tag name not found', async () => {
      const found = await repository.findByName('NonExistent');

      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all tags', async () => {
      const tag1 = Tag.create({ name: 'Work', icon: '💼', color: '#ff0000', defaultCapacity: 21 });
      const tag2 = Tag.create({ name: 'Personal', icon: '🏠', color: '#00ff00', defaultCapacity: 10 });
      await repository.save(tag1);
      await repository.save(tag2);

      const all = await repository.findAll();

      expect(all.length).toBe(2);
    });
  });

  describe('delete', () => {
    it('should delete a tag', async () => {
      const tag = Tag.create({ name: 'Work', icon: '💼', color: '#ff0000', defaultCapacity: 21 });
      await repository.save(tag);

      await repository.delete(tag.id);

      const found = await repository.findById(tag.id);
      expect(found).toBeNull();
    });
  });
});
