import { describe, it, expect } from 'vitest';
import { TaskStatus, TASK_STATUSES } from '../../src/value-objects/TaskStatus';

describe('TaskStatus', () => {
  describe('TASK_STATUSES constant', () => {
    it('should contain active, completed, and canceled', () => {
      expect(TASK_STATUSES).toEqual(['active', 'completed', 'canceled']);
    });
  });

  describe('create', () => {
    it.each(TASK_STATUSES)('should accept valid status "%s"', (status) => {
      const taskStatus = TaskStatus.create(status);
      expect(taskStatus.value).toBe(status);
    });

    it('should reject invalid status', () => {
      expect(() => TaskStatus.create('invalid' as any)).toThrow(
        'Invalid task status'
      );
    });
  });

  describe('isActive', () => {
    it('should return true for active', () => {
      expect(TaskStatus.create('active').isActive()).toBe(true);
    });

    it('should return false for other statuses', () => {
      expect(TaskStatus.create('completed').isActive()).toBe(false);
      expect(TaskStatus.create('canceled').isActive()).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return true for completed', () => {
      expect(TaskStatus.create('completed').isCompleted()).toBe(true);
    });

    it('should return false for other statuses', () => {
      expect(TaskStatus.create('active').isCompleted()).toBe(false);
      expect(TaskStatus.create('canceled').isCompleted()).toBe(false);
    });
  });

  describe('isCanceled', () => {
    it('should return true for canceled', () => {
      expect(TaskStatus.create('canceled').isCanceled()).toBe(true);
    });

    it('should return false for other statuses', () => {
      expect(TaskStatus.create('active').isCanceled()).toBe(false);
      expect(TaskStatus.create('completed').isCanceled()).toBe(false);
    });
  });

  describe('isTerminal', () => {
    it('should return true for completed and canceled', () => {
      expect(TaskStatus.create('completed').isTerminal()).toBe(true);
      expect(TaskStatus.create('canceled').isTerminal()).toBe(true);
    });

    it('should return false for active', () => {
      expect(TaskStatus.create('active').isTerminal()).toBe(false);
    });
  });

  describe('canTransitionTo', () => {
    it('should allow active to transition to completed', () => {
      const status = TaskStatus.create('active');
      expect(status.canTransitionTo(TaskStatus.create('completed'))).toBe(true);
    });

    it('should allow active to transition to canceled', () => {
      const status = TaskStatus.create('active');
      expect(status.canTransitionTo(TaskStatus.create('canceled'))).toBe(true);
    });

    it('should not allow completed to transition to any status', () => {
      const status = TaskStatus.create('completed');
      expect(status.canTransitionTo(TaskStatus.create('active'))).toBe(false);
      expect(status.canTransitionTo(TaskStatus.create('canceled'))).toBe(false);
      expect(status.canTransitionTo(TaskStatus.create('completed'))).toBe(false);
    });

    it('should not allow canceled to transition to any status', () => {
      const status = TaskStatus.create('canceled');
      expect(status.canTransitionTo(TaskStatus.create('active'))).toBe(false);
      expect(status.canTransitionTo(TaskStatus.create('completed'))).toBe(false);
      expect(status.canTransitionTo(TaskStatus.create('canceled'))).toBe(false);
    });
  });

  describe('factory methods', () => {
    it('active() should create active status', () => {
      expect(TaskStatus.active().value).toBe('active');
    });

    it('completed() should create completed status', () => {
      expect(TaskStatus.completed().value).toBe('completed');
    });

    it('canceled() should create canceled status', () => {
      expect(TaskStatus.canceled().value).toBe('canceled');
    });
  });
});
