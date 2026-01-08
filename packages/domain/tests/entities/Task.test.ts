import { describe, it, expect } from 'vitest';
import { Task } from '../../src/entities/Task';

describe('Task', () => {
  const validTagPoints = { 'tag-1': 3 };

  describe('create', () => {
    it('should create a task with required fields', () => {
      const task = Task.create({
        title: 'Test Task',
        tagPoints: validTagPoints
      });

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('');
      expect(task.status.isActive()).toBe(true);
      expect(task.tagPoints.getValue('tag-1')).toBe(3);
      expect(task.location.isBacklog()).toBe(true);
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.completedAt).toBeNull();
      expect(task.canceledAt).toBeNull();
      expect(task.skipState).toBeNull();
      expect(task.recurrence).toBeNull();
      expect(task.parentId).toBeNull();
    });

    it('should create a task with optional fields', () => {
      const task = Task.create({
        title: 'Test Task',
        description: 'A description',
        tagPoints: { 'tag-1': 5, 'tag-2': 8 }
      });

      expect(task.description).toBe('A description');
      expect(task.tagPoints.totalPoints()).toBe(13);
    });

    it('should throw for empty title', () => {
      expect(() => Task.create({
        title: '',
        tagPoints: validTagPoints
      })).toThrow('Task title cannot be empty');
    });

    it('should throw for whitespace-only title', () => {
      expect(() => Task.create({
        title: '   ',
        tagPoints: validTagPoints
      })).toThrow('Task title cannot be empty');
    });

    it('should throw for empty tagPoints', () => {
      expect(() => Task.create({
        title: 'Test',
        tagPoints: {}
      })).toThrow('Task must have at least one tag with points');
    });

    it('should throw for invalid Fibonacci points', () => {
      expect(() => Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 4 }
      })).toThrow('Points must be a valid Fibonacci number');
    });

    it('should trim title', () => {
      const task = Task.create({
        title: '  Test Task  ',
        tagPoints: validTagPoints
      });
      expect(task.title).toBe('Test Task');
    });
  });

  describe('complete', () => {
    it('should mark task as completed', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const completed = task.complete();

      expect(completed.status.isCompleted()).toBe(true);
      expect(completed.completedAt).toBeInstanceOf(Date);
    });

    it('should throw if task is not active', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const completed = task.complete();

      expect(() => completed.complete()).toThrow(
        'Cannot complete a task that is not active'
      );
    });

    it('should clear skip state', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const skipped = task.skipForNow();
      const completed = skipped.complete();

      expect(completed.skipState).toBeNull();
    });

    it('should not mutate original', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      task.complete();
      expect(task.status.isActive()).toBe(true);
    });
  });

  describe('cancel', () => {
    it('should mark task as canceled with justification comment', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const { task: canceled, comment } = task.cancel('No longer needed');

      expect(canceled.status.isCanceled()).toBe(true);
      expect(canceled.canceledAt).toBeInstanceOf(Date);
      expect(comment.isCancelJustification).toBe(true);
      expect(comment.content).toBe('No longer needed');
    });

    it('should throw if task is not active', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const { task: canceled } = task.cancel('Reason');

      expect(() => canceled.cancel('Another reason')).toThrow(
        'Cannot cancel a task that is not active'
      );
    });

    it('should throw for empty justification', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      expect(() => task.cancel('')).toThrow('Cancellation justification is required');
    });
  });

  describe('updateTitle', () => {
    it('should update the title', () => {
      const task = Task.create({ title: 'Original', tagPoints: validTagPoints });
      const updated = task.updateTitle('Updated Title');
      expect(updated.title).toBe('Updated Title');
    });

    it('should throw for empty title', () => {
      const task = Task.create({ title: 'Original', tagPoints: validTagPoints });
      expect(() => task.updateTitle('')).toThrow('Task title cannot be empty');
    });

    it('should throw if task is not active', () => {
      const task = Task.create({ title: 'Original', tagPoints: validTagPoints });
      const completed = task.complete();
      expect(() => completed.updateTitle('New')).toThrow(
        'Cannot modify a completed or canceled task'
      );
    });
  });

  describe('updateDescription', () => {
    it('should update the description', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const updated = task.updateDescription('New description');
      expect(updated.description).toBe('New description');
    });

    it('should allow empty description', () => {
      const task = Task.create({
        title: 'Test',
        description: 'Has description',
        tagPoints: validTagPoints
      });
      const updated = task.updateDescription('');
      expect(updated.description).toBe('');
    });
  });

  describe('moveToBacklog', () => {
    it('should move task to backlog', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const inSprint = task.moveToSprint('sprint-1');
      const inBacklog = inSprint.moveToBacklog();

      expect(inBacklog.location.isBacklog()).toBe(true);
    });

    it('should clear skip state', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const skipped = task.skipForNow();
      const inBacklog = skipped.moveToBacklog();

      expect(inBacklog.skipState).toBeNull();
    });

    it('should record sprint in history', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const inSprint = task.moveToSprint('sprint-1');
      const inBacklog = inSprint.moveToBacklog();

      expect(inBacklog.sprintHistory).toContain('sprint-1');
    });
  });

  describe('moveToSprint', () => {
    it('should move task to sprint', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const inSprint = task.moveToSprint('sprint-123');

      expect(inSprint.location.isSprint()).toBe(true);
      expect(inSprint.location.sprintId).toBe('sprint-123');
    });

    it('should clear skip state', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const skipped = task.skipForNow();
      const inSprint = skipped.moveToSprint('sprint-1');

      expect(inSprint.skipState).toBeNull();
    });
  });

  describe('skipForNow', () => {
    it('should set skip state to for_now', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const skipped = task.skipForNow();

      expect(skipped.skipState?.isForNow()).toBe(true);
    });

    it('should throw if task is not active', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const completed = task.complete();
      expect(() => completed.skipForNow()).toThrow(
        'Cannot skip a completed or canceled task'
      );
    });
  });

  describe('skipForDay', () => {
    it('should set skip state to for_day with justification comment', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const { task: skipped, comment } = task.skipForDay('Need to focus elsewhere');

      expect(skipped.skipState?.isForDay()).toBe(true);
      expect(skipped.skipState?.justificationCommentId).toBe(comment.id);
      expect(comment.isSkipJustification).toBe(true);
    });

    it('should throw for empty justification', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      expect(() => task.skipForDay('')).toThrow(
        'Justification is required for skip for day'
      );
    });
  });

  describe('clearSkipState', () => {
    it('should clear skip state', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const skipped = task.skipForNow();
      const cleared = skipped.clearSkipState();

      expect(cleared.skipState).toBeNull();
    });
  });

  describe('addTag', () => {
    it('should add a new tag with points', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const updated = task.addTag('tag-2', 5);

      expect(updated.tagPoints.hasTag('tag-2')).toBe(true);
      expect(updated.tagPoints.getValue('tag-2')).toBe(5);
    });

    it('should throw for invalid points', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      expect(() => task.addTag('tag-2', 4)).toThrow();
    });
  });

  describe('removeTag', () => {
    it('should remove a tag', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 3, 'tag-2': 5 }
      });
      const updated = task.removeTag('tag-1');

      expect(updated.tagPoints.hasTag('tag-1')).toBe(false);
      expect(updated.tagPoints.hasTag('tag-2')).toBe(true);
    });

    it('should throw when removing last tag', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      expect(() => task.removeTag('tag-1')).toThrow(
        'Task must have at least one tag with points'
      );
    });
  });

  describe('updateTagPoints', () => {
    it('should update points for existing tag', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const updated = task.updateTagPoints('tag-1', 8);

      expect(updated.tagPoints.getValue('tag-1')).toBe(8);
    });
  });

  describe('totalPoints', () => {
    it('should return total points across all tags', () => {
      const task = Task.create({
        title: 'Test',
        tagPoints: { 'tag-1': 3, 'tag-2': 5, 'tag-3': 8 }
      });

      expect(task.totalPoints).toBe(16);
    });
  });

  describe('getAge', () => {
    it('should return age in days', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      // Age should be 0 for a newly created task
      expect(task.getAge()).toBe(0);
    });
  });

  describe('recurring tasks', () => {
    it('should create a recurring template', () => {
      const task = Task.create({
        title: 'Weekly Review',
        tagPoints: validTagPoints,
        recurrence: 'FREQ=WEEKLY;BYDAY=SU'
      });

      expect(task.isRecurringTemplate()).toBe(true);
      expect(task.recurrence).toBe('FREQ=WEEKLY;BYDAY=SU');
    });

    it('should spawn an instance from template', () => {
      const template = Task.create({
        title: 'Weekly Review',
        tagPoints: validTagPoints,
        recurrence: 'FREQ=WEEKLY;BYDAY=SU'
      });

      const instance = template.spawnInstance();

      expect(instance.parentId).toBe(template.id);
      expect(instance.isRecurringTemplate()).toBe(false);
      expect(instance.title).toBe(template.title);
      expect(instance.tagPoints.toRecord()).toEqual(template.tagPoints.toRecord());
    });

    it('should throw when spawning from non-template', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      expect(() => task.spawnInstance()).toThrow(
        'Can only spawn instances from recurring templates'
      );
    });
  });

  describe('removeComment', () => {
    it('should remove a comment by id', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const { task: taskWithComment, comment } = task.addComment('My comment');

      expect(taskWithComment.comments).toHaveLength(1);

      const taskWithoutComment = taskWithComment.removeComment(comment.id);

      expect(taskWithoutComment.comments).toHaveLength(0);
    });

    it('should throw if comment not found', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });

      expect(() => task.removeComment('non-existent')).toThrow('Comment not found');
    });

    it('should throw if comment is a skip justification', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const { task: skippedTask, comment } = task.skipForDay('Reason');

      expect(() => skippedTask.removeComment(comment.id)).toThrow(
        'Cannot delete skip justification comment'
      );
    });

    it('should throw if comment is a cancel justification', () => {
      const task = Task.create({ title: 'Test', tagPoints: validTagPoints });
      const { task: canceledTask, comment } = task.cancel('Reason');

      expect(() => canceledTask.removeComment(comment.id)).toThrow(
        'Cannot delete cancel justification comment'
      );
    });
  });

  describe('fromObject / toObject', () => {
    it('should serialize and deserialize a task', () => {
      const task = Task.create({
        title: 'Test Task',
        description: 'A description',
        tagPoints: { 'tag-1': 5 }
      });

      const obj = task.toObject();
      const restored = Task.fromObject(obj);

      expect(restored.id).toBe(task.id);
      expect(restored.title).toBe(task.title);
      expect(restored.description).toBe(task.description);
      expect(restored.status.value).toBe(task.status.value);
      expect(restored.tagPoints.toRecord()).toEqual(task.tagPoints.toRecord());
    });
  });
});
