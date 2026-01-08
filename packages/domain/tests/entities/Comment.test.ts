import { describe, it, expect } from 'vitest';
import { Comment } from '../../src/entities/Comment';

describe('Comment', () => {
  describe('create', () => {
    it('should create a comment with required fields', () => {
      const comment = Comment.create({
        content: 'This is a test comment'
      });

      expect(comment.id).toBeDefined();
      expect(comment.content).toBe('This is a test comment');
      expect(comment.createdAt).toBeInstanceOf(Date);
      expect(comment.updatedAt).toBeNull();
      expect(comment.isSkipJustification).toBe(false);
      expect(comment.isCancelJustification).toBe(false);
    });

    it('should throw for empty content', () => {
      expect(() => Comment.create({ content: '' })).toThrow(
        'Comment content cannot be empty'
      );
    });

    it('should throw for whitespace-only content', () => {
      expect(() => Comment.create({ content: '   ' })).toThrow(
        'Comment content cannot be empty'
      );
    });

    it('should trim content', () => {
      const comment = Comment.create({ content: '  test content  ' });
      expect(comment.content).toBe('test content');
    });
  });

  describe('createSkipJustification', () => {
    it('should create a skip justification comment', () => {
      const comment = Comment.createSkipJustification('I need to focus on urgent tasks');

      expect(comment.isSkipJustification).toBe(true);
      expect(comment.isCancelJustification).toBe(false);
      expect(comment.content).toBe('I need to focus on urgent tasks');
    });
  });

  describe('createCancelJustification', () => {
    it('should create a cancel justification comment', () => {
      const comment = Comment.createCancelJustification('Task is no longer relevant');

      expect(comment.isCancelJustification).toBe(true);
      expect(comment.isSkipJustification).toBe(false);
      expect(comment.content).toBe('Task is no longer relevant');
    });
  });

  describe('updateContent', () => {
    it('should update the content and set updatedAt', () => {
      const comment = Comment.create({ content: 'Original content' });
      const originalCreatedAt = comment.createdAt;

      const updated = comment.updateContent('Updated content');

      expect(updated.content).toBe('Updated content');
      expect(updated.createdAt).toEqual(originalCreatedAt);
      expect(updated.updatedAt).toBeInstanceOf(Date);
      expect(updated.id).toBe(comment.id);
    });

    it('should throw for empty new content', () => {
      const comment = Comment.create({ content: 'Original' });
      expect(() => comment.updateContent('')).toThrow(
        'Comment content cannot be empty'
      );
    });

    it('should not mutate original comment', () => {
      const comment = Comment.create({ content: 'Original' });
      comment.updateContent('Updated');
      expect(comment.content).toBe('Original');
    });
  });

  describe('fromObject', () => {
    it('should recreate comment from object', () => {
      const obj = {
        id: 'comment-123',
        content: 'Test content',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T11:00:00Z',
        isSkipJustification: true,
        isCancelJustification: false
      };

      const comment = Comment.fromObject(obj);

      expect(comment.id).toBe('comment-123');
      expect(comment.content).toBe('Test content');
      expect(comment.createdAt).toEqual(new Date('2025-01-15T10:00:00Z'));
      expect(comment.updatedAt).toEqual(new Date('2025-01-15T11:00:00Z'));
      expect(comment.isSkipJustification).toBe(true);
      expect(comment.isCancelJustification).toBe(false);
    });

    it('should handle null updatedAt', () => {
      const obj = {
        id: 'comment-123',
        content: 'Test content',
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: null,
        isSkipJustification: false,
        isCancelJustification: false
      };

      const comment = Comment.fromObject(obj);
      expect(comment.updatedAt).toBeNull();
    });
  });

  describe('toObject', () => {
    it('should serialize comment to object', () => {
      const comment = Comment.create({ content: 'Test' });
      const obj = comment.toObject();

      expect(obj.id).toBe(comment.id);
      expect(obj.content).toBe('Test');
      expect(typeof obj.createdAt).toBe('string');
      expect(obj.isSkipJustification).toBe(false);
      expect(obj.isCancelJustification).toBe(false);
    });
  });
});
