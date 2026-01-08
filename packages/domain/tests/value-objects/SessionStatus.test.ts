import { describe, it, expect } from 'vitest';
import { SessionStatus, SESSION_STATUSES } from '../../src/value-objects/SessionStatus';

describe('SessionStatus', () => {
  describe('SESSION_STATUSES constant', () => {
    it('should contain in_progress, completed, and abandoned', () => {
      expect(SESSION_STATUSES).toEqual(['in_progress', 'completed', 'abandoned']);
    });
  });

  describe('create', () => {
    it.each(SESSION_STATUSES)('should accept valid status "%s"', (status) => {
      const sessionStatus = SessionStatus.create(status);
      expect(sessionStatus.value).toBe(status);
    });

    it('should reject invalid status', () => {
      expect(() => SessionStatus.create('invalid' as any)).toThrow(
        'Invalid session status'
      );
    });
  });

  describe('isInProgress', () => {
    it('should return true for in_progress', () => {
      expect(SessionStatus.create('in_progress').isInProgress()).toBe(true);
    });

    it('should return false for other statuses', () => {
      expect(SessionStatus.create('completed').isInProgress()).toBe(false);
      expect(SessionStatus.create('abandoned').isInProgress()).toBe(false);
    });
  });

  describe('isCompleted', () => {
    it('should return true for completed', () => {
      expect(SessionStatus.create('completed').isCompleted()).toBe(true);
    });

    it('should return false for other statuses', () => {
      expect(SessionStatus.create('in_progress').isCompleted()).toBe(false);
      expect(SessionStatus.create('abandoned').isCompleted()).toBe(false);
    });
  });

  describe('isAbandoned', () => {
    it('should return true for abandoned', () => {
      expect(SessionStatus.create('abandoned').isAbandoned()).toBe(true);
    });

    it('should return false for other statuses', () => {
      expect(SessionStatus.create('in_progress').isAbandoned()).toBe(false);
      expect(SessionStatus.create('completed').isAbandoned()).toBe(false);
    });
  });

  describe('isTerminal', () => {
    it('should return true for completed and abandoned', () => {
      expect(SessionStatus.create('completed').isTerminal()).toBe(true);
      expect(SessionStatus.create('abandoned').isTerminal()).toBe(true);
    });

    it('should return false for in_progress', () => {
      expect(SessionStatus.create('in_progress').isTerminal()).toBe(false);
    });
  });

  describe('inProgress factory', () => {
    it('should create an in_progress status', () => {
      const status = SessionStatus.inProgress();
      expect(status.value).toBe('in_progress');
    });
  });

  describe('completed factory', () => {
    it('should create a completed status', () => {
      const status = SessionStatus.completed();
      expect(status.value).toBe('completed');
    });
  });

  describe('abandoned factory', () => {
    it('should create an abandoned status', () => {
      const status = SessionStatus.abandoned();
      expect(status.value).toBe('abandoned');
    });
  });
});
