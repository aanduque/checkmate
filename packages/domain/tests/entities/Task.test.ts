import { describe, it, expect } from 'vitest';
import { Task } from '../../src/entities/Task';
import { FocusLevel } from '../../src/value-objects/FocusLevel';
import { SprintId } from '../../src/value-objects/SprintId';

describe('Task', () => {
  describe('create', () => {
    it('should create a task with required properties', () => {
      const task = Task.create({
        title: 'Test task',
        tagPoints: { 'tag-1': 3 },
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test task');
      expect(task.status).toBe('active');
      expect(task.tagPoints.toRecord()).toEqual({ 'tag-1': 3 });
      expect(task.location.isBacklog()).toBe(true);
    });

    it('should not allow empty title', () => {
      expect(() =>
        Task.create({ title: '', tagPoints: { 'tag-1': 1 } })
      ).toThrow('Task title cannot be empty');
    });

    it('should require at least one tag', () => {
      expect(() => Task.create({ title: 'Test', tagPoints: {} })).toThrow(
        'Task must have at least one tag with points'
      );
    });

    it('should validate point values are Fibonacci numbers', () => {
      expect(() =>
        Task.create({ title: 'Test', tagPoints: { 'tag-1': 4 } })
      ).toThrow('Invalid points value');
    });

    it('should create a recurring template', () => {
      const task = Task.create({
        title: 'Daily standup',
        tagPoints: { 'work': 1 },
        recurrence: 'FREQ=DAILY',
      });

      expect(task.isRecurringTemplate()).toBe(true);
      expect(task.recurrence?.toString()).toBe('FREQ=DAILY');
    });
  });

  describe('status transitions', () => {
    it('should complete an active task', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });

      task.complete();

      expect(task.isCompleted()).toBe(true);
      expect(task.completedAt).toBeDefined();
    });

    it('should cancel an active task', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });

      task.cancel();

      expect(task.isCanceled()).toBe(true);
      expect(task.canceledAt).toBeDefined();
    });

    it('should not allow modifying a completed task', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });
      task.complete();

      expect(() => task.updateTitle('New title')).toThrow(
        'Cannot modify a completed or canceled task'
      );
    });
  });

  describe('location management', () => {
    it('should move task to sprint', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });
      const sprintId = SprintId.create();

      task.moveToSprint(sprintId);

      expect(task.location.isSprint()).toBe(true);
      expect(task.location.getSprintId()?.equals(sprintId)).toBe(true);
    });

    it('should move task back to backlog', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });
      const sprintId = SprintId.create();
      task.moveToSprint(sprintId);

      task.moveToBacklog();

      expect(task.location.isBacklog()).toBe(true);
      expect(task.sprintHistory).toContain(sprintId.toString());
    });

    it('should not allow recurring template to move to sprint', () => {
      const task = Task.create({
        title: 'Daily',
        tagPoints: { 'tag-1': 1 },
        recurrence: 'FREQ=DAILY',
      });

      expect(() => task.moveToSprint(SprintId.create())).toThrow(
        'Recurring templates cannot be moved to a sprint'
      );
    });
  });

  describe('skip state', () => {
    it('should skip task for now', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });

      task.skipForNow();

      expect(task.skipState?.isForNow()).toBe(true);
    });

    it('should skip task for day with justification', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });

      const commentId = task.skipForDay('Too tired today');

      expect(task.skipState?.isForDay()).toBe(true);
      expect(task.comments.length).toBe(1);
      expect(task.comments[0].content).toBe('Too tired today');
      expect(task.comments[0].skipJustification).toBe(true);
    });

    it('should require justification for skip-for-day', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });

      expect(() => task.skipForDay('')).toThrow(
        'Skip justification is required'
      );
    });

    it('should clear skip state', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });
      task.skipForNow();

      task.clearSkipState();

      expect(task.skipState).toBeUndefined();
    });
  });

  describe('sessions', () => {
    it('should start a session', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });

      const session = task.startSession();

      expect(session.isInProgress()).toBe(true);
      expect(task.sessions.length).toBe(1);
    });

    it('should not start multiple sessions', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });
      task.startSession();

      expect(() => task.startSession()).toThrow(
        'A session is already in progress'
      );
    });

    it('should complete a session', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });
      const session = task.startSession();

      task.completeSession(session.id, FocusLevel.focused(), 'Great session');

      expect(task.sessions[0].isCompleted()).toBe(true);
      expect(task.sessions[0].focusLevel?.isFocused()).toBe(true);
    });

    it('should abandon a session', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 1 },
      });
      const session = task.startSession();

      task.abandonSession(session.id);

      expect(task.sessions[0].isAbandoned()).toBe(true);
    });
  });

  describe('spawn instance', () => {
    it('should spawn instance from template', () => {
      const template = Task.create({
        title: 'Daily standup',
        tagPoints: { 'work': 2 },
        recurrence: 'FREQ=DAILY',
      });

      const instance = template.spawnInstance();

      expect(instance.title).toBe('Daily standup');
      expect(instance.tagPoints.toRecord()).toEqual({ 'work': 2 });
      expect(instance.isRecurringInstance()).toBe(true);
      expect(instance.parentId?.equals(template.id)).toBe(true);
      expect(instance.recurrence).toBeUndefined();
    });

    it('should not spawn from non-template', () => {
      const task = Task.create({
        title: 'Regular task',
        tagPoints: { 'tag-1': 1 },
      });

      expect(() => task.spawnInstance()).toThrow(
        'Can only spawn instances from recurring templates'
      );
    });
  });
});
