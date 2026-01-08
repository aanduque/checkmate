import { describe, it, expect } from 'vitest';
import { TaskId } from '../../src/value-objects/TaskId';

describe('TaskId', () => {
  describe('create', () => {
    it('should create a new TaskId with a generated UUID', () => {
      const taskId = TaskId.create();
      expect(taskId.value).toBeDefined();
      expect(typeof taskId.value).toBe('string');
      expect(taskId.value.length).toBeGreaterThan(0);
    });

    it('should create unique TaskIds', () => {
      const taskId1 = TaskId.create();
      const taskId2 = TaskId.create();
      expect(taskId1.value).not.toBe(taskId2.value);
    });
  });

  describe('fromString', () => {
    it('should create a TaskId from a valid string', () => {
      const id = 'task_abc123';
      const taskId = TaskId.fromString(id);
      expect(taskId.value).toBe(id);
    });

    it('should throw error for empty string', () => {
      expect(() => TaskId.fromString('')).toThrow('TaskId cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => TaskId.fromString('   ')).toThrow('TaskId cannot be empty');
    });
  });

  describe('equals', () => {
    it('should return true for TaskIds with same value', () => {
      const taskId1 = TaskId.fromString('task_123');
      const taskId2 = TaskId.fromString('task_123');
      expect(taskId1.equals(taskId2)).toBe(true);
    });

    it('should return false for TaskIds with different values', () => {
      const taskId1 = TaskId.fromString('task_123');
      const taskId2 = TaskId.fromString('task_456');
      expect(taskId1.equals(taskId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the string value', () => {
      const id = 'task_xyz';
      const taskId = TaskId.fromString(id);
      expect(taskId.toString()).toBe(id);
    });
  });
});
