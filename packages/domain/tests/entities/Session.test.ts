import { describe, it, expect } from 'vitest';
import { Session } from '../../src/entities/Session';

describe('Session', () => {
  describe('start', () => {
    it('should create a new in-progress session', () => {
      const session = Session.start('task-123');

      expect(session.id).toBeDefined();
      expect(session.taskId).toBe('task-123');
      expect(session.status.isInProgress()).toBe(true);
      expect(session.startedAt).toBeInstanceOf(Date);
      expect(session.endedAt).toBeNull();
      expect(session.focusLevel).toBeNull();
      expect(session.isManual).toBe(false);
    });

    it('should throw for empty taskId', () => {
      expect(() => Session.start('')).toThrow('Task ID is required');
    });
  });

  describe('complete', () => {
    it('should mark session as completed with focus level', () => {
      const session = Session.start('task-123');
      const completed = session.complete('focused');

      expect(completed.status.isCompleted()).toBe(true);
      expect(completed.endedAt).toBeInstanceOf(Date);
      expect(completed.focusLevel?.isFocused()).toBe(true);
    });

    it('should accept all valid focus levels', () => {
      const session = Session.start('task-123');

      expect(session.complete('distracted').focusLevel?.isDistracted()).toBe(true);
      expect(session.complete('neutral').focusLevel?.isNeutral()).toBe(true);
      expect(session.complete('focused').focusLevel?.isFocused()).toBe(true);
    });

    it('should throw if session is not in progress', () => {
      const session = Session.start('task-123');
      const completed = session.complete('focused');

      expect(() => completed.complete('neutral')).toThrow(
        'Can only complete an in-progress session'
      );
    });

    it('should not mutate original session', () => {
      const session = Session.start('task-123');
      session.complete('focused');
      expect(session.status.isInProgress()).toBe(true);
    });
  });

  describe('abandon', () => {
    it('should mark session as abandoned', () => {
      const session = Session.start('task-123');
      const abandoned = session.abandon();

      expect(abandoned.status.isAbandoned()).toBe(true);
      expect(abandoned.endedAt).toBeInstanceOf(Date);
      expect(abandoned.focusLevel).toBeNull();
    });

    it('should throw if session is not in progress', () => {
      const session = Session.start('task-123');
      const abandoned = session.abandon();

      expect(() => abandoned.abandon()).toThrow(
        'Can only abandon an in-progress session'
      );
    });
  });

  describe('addNote', () => {
    it('should add a note to the session', () => {
      const session = Session.start('task-123');
      const withNote = session.addNote('Made good progress');

      expect(withNote.note).toBe('Made good progress');
    });

    it('should not mutate original', () => {
      const session = Session.start('task-123');
      session.addNote('Test note');
      expect(session.note).toBeNull();
    });
  });

  describe('createManual', () => {
    it('should create a completed manual session', () => {
      const startedAt = new Date('2025-01-15T10:00:00Z');
      const endedAt = new Date('2025-01-15T10:30:00Z');

      const session = Session.createManual({
        taskId: 'task-123',
        startedAt,
        endedAt,
        focusLevel: 'focused'
      });

      expect(session.isManual).toBe(true);
      expect(session.status.isCompleted()).toBe(true);
      expect(session.startedAt).toEqual(startedAt);
      expect(session.endedAt).toEqual(endedAt);
      expect(session.focusLevel?.isFocused()).toBe(true);
    });

    it('should throw if endedAt is before startedAt', () => {
      expect(() => Session.createManual({
        taskId: 'task-123',
        startedAt: new Date('2025-01-15T11:00:00Z'),
        endedAt: new Date('2025-01-15T10:00:00Z'),
        focusLevel: 'neutral'
      })).toThrow('End time must be after start time');
    });
  });

  describe('duration', () => {
    it('should calculate duration in seconds for completed session', () => {
      const session = Session.createManual({
        taskId: 'task-123',
        startedAt: new Date('2025-01-15T10:00:00Z'),
        endedAt: new Date('2025-01-15T10:30:00Z'),
        focusLevel: 'neutral'
      });

      expect(session.durationSeconds).toBe(30 * 60); // 30 minutes in seconds
    });

    it('should return 0 for in-progress session', () => {
      const session = Session.start('task-123');
      expect(session.durationSeconds).toBe(0);
    });
  });

  describe('fromObject', () => {
    it('should recreate session from object', () => {
      const obj = {
        id: 'session-123',
        taskId: 'task-456',
        status: 'completed' as const,
        startedAt: '2025-01-15T10:00:00Z',
        endedAt: '2025-01-15T10:30:00Z',
        focusLevel: 'focused' as const,
        note: 'Good session',
        isManual: false
      };

      const session = Session.fromObject(obj);

      expect(session.id).toBe('session-123');
      expect(session.taskId).toBe('task-456');
      expect(session.status.isCompleted()).toBe(true);
      expect(session.focusLevel?.isFocused()).toBe(true);
      expect(session.note).toBe('Good session');
    });
  });

  describe('toObject', () => {
    it('should serialize session to object', () => {
      const session = Session.start('task-123');
      const obj = session.toObject();

      expect(obj.id).toBe(session.id);
      expect(obj.taskId).toBe('task-123');
      expect(obj.status).toBe('in_progress');
      expect(typeof obj.startedAt).toBe('string');
    });
  });
});
