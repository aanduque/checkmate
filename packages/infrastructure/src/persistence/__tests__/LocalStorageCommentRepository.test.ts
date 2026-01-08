/**
 * LocalStorageCommentRepository - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Comment } from '@checkmate/domain';
import { LocalStorageCommentRepository } from '../LocalStorageCommentRepository';

// Simple mock Storage
class MockStorage implements Storage {
  private data: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.data).length;
  }

  key(index: number): string | null {
    return Object.keys(this.data)[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.data[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = value;
  }

  removeItem(key: string): void {
    delete this.data[key];
  }

  clear(): void {
    this.data = {};
  }
}

describe('LocalStorageCommentRepository', () => {
  let storage: MockStorage;
  let repository: LocalStorageCommentRepository;

  beforeEach(() => {
    storage = new MockStorage();
    repository = new LocalStorageCommentRepository(storage);
  });

  describe('save and findById', () => {
    it('should save and retrieve a comment', async () => {
      const comment = Comment.create({ content: 'Test comment' });
      const taskId = 'task_123';

      await repository.save(comment, taskId);
      const found = await repository.findById(comment.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(comment.id);
      expect(found!.content).toBe('Test comment');
    });

    it('should return null for non-existent comment', async () => {
      const found = await repository.findById('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('findByTaskId', () => {
    it('should find all comments for a task', async () => {
      const taskId = 'task_123';
      const comment1 = Comment.create({ content: 'First comment' });
      const comment2 = Comment.create({ content: 'Second comment' });
      const comment3 = Comment.create({ content: 'Other task comment' });

      await repository.save(comment1, taskId);
      await repository.save(comment2, taskId);
      await repository.save(comment3, 'other_task');

      const found = await repository.findByTaskId(taskId);

      expect(found).toHaveLength(2);
      expect(found.map(c => c.content)).toContain('First comment');
      expect(found.map(c => c.content)).toContain('Second comment');
    });

    it('should return empty array for task with no comments', async () => {
      const found = await repository.findByTaskId('task_no_comments');
      expect(found).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete a comment', async () => {
      const comment = Comment.create({ content: 'To be deleted' });
      const taskId = 'task_123';

      await repository.save(comment, taskId);
      await repository.delete(comment.id);

      const found = await repository.findById(comment.id);
      expect(found).toBeNull();
    });

    it('should not throw when deleting non-existent comment', async () => {
      await expect(repository.delete('nonexistent')).resolves.toBeUndefined();
    });
  });

  describe('persistence', () => {
    it('should persist comments across repository instances', async () => {
      const comment = Comment.create({ content: 'Persisted comment' });
      const taskId = 'task_123';

      await repository.save(comment, taskId);

      // Create new repository instance with same storage
      const newRepository = new LocalStorageCommentRepository(storage);
      const found = await newRepository.findById(comment.id);

      expect(found).not.toBeNull();
      expect(found!.content).toBe('Persisted comment');
    });
  });

  describe('special comments', () => {
    it('should preserve skip justification flag', async () => {
      const comment = Comment.createSkipJustification('I need to skip this');
      const taskId = 'task_123';

      await repository.save(comment, taskId);
      const found = await repository.findById(comment.id);

      expect(found!.isSkipJustification).toBe(true);
      expect(found!.isCancelJustification).toBe(false);
    });

    it('should preserve cancel justification flag', async () => {
      const comment = Comment.createCancelJustification('No longer needed');
      const taskId = 'task_123';

      await repository.save(comment, taskId);
      const found = await repository.findById(comment.id);

      expect(found!.isSkipJustification).toBe(false);
      expect(found!.isCancelJustification).toBe(true);
    });
  });
});
