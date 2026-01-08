/**
 * DeleteTaskCommentCommand Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteTaskCommentHandler, DeleteTaskCommentCommand } from '../../src/commands/DeleteTaskCommentCommand';
import { Task, ITaskRepository, TaskLocation } from '@checkmate/domain';

// In-memory repository implementation for testing
class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async findByLocation(location: TaskLocation): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => {
      if (location.isBacklog()) return t.location.isBacklog();
      if (location.isSprint()) return t.location.sprintId === location.sprintId;
      return false;
    });
  }

  async findTemplates(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.isRecurringTemplate());
  }

  async findByParentId(parentId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.parentId === parentId);
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  addTask(task: Task): void {
    this.tasks.set(task.id, task);
  }
}

describe('DeleteTaskCommentCommand', () => {
  let handler: DeleteTaskCommentHandler;
  let taskRepository: InMemoryTaskRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    handler = new DeleteTaskCommentHandler(taskRepository);
  });

  const createTaskWithComment = () => {
    const task = Task.create({
      title: 'Test Task',
      tagPoints: { 'tag-1': 3 }
    });
    return task.addComment('Test comment');
  };

  describe('successful deletion', () => {
    it('should delete a comment from task', async () => {
      const { task, comment } = createTaskWithComment();
      taskRepository.addTask(task);

      const result = await handler.execute({
        taskId: task.id,
        commentId: comment.id
      });

      expect(result.taskId).toBe(task.id);
      expect(result.commentId).toBe(comment.id);
    });

    it('should persist the updated task without comment', async () => {
      const { task, comment } = createTaskWithComment();
      taskRepository.addTask(task);

      await handler.execute({
        taskId: task.id,
        commentId: comment.id
      });

      const saved = await taskRepository.findById(task.id);
      expect(saved!.comments).toHaveLength(0);
    });
  });

  describe('validation errors', () => {
    it('should throw if task not found', async () => {
      await expect(handler.execute({
        taskId: 'non-existent',
        commentId: 'comment-1'
      })).rejects.toThrow('Task not found');
    });

    it('should throw if comment not found', async () => {
      const task = Task.create({
        title: 'Test Task',
        tagPoints: { 'tag-1': 3 }
      });
      taskRepository.addTask(task);

      await expect(handler.execute({
        taskId: task.id,
        commentId: 'non-existent'
      })).rejects.toThrow('Comment not found');
    });

    it('should throw if comment is a skip justification', async () => {
      const task = Task.create({
        title: 'Test Task',
        tagPoints: { 'tag-1': 3 }
      });
      const { task: skippedTask, comment } = task.skipForDay('I need to skip');
      taskRepository.addTask(skippedTask);

      await expect(handler.execute({
        taskId: skippedTask.id,
        commentId: comment.id
      })).rejects.toThrow('Cannot delete skip justification comment');
    });
  });
});
