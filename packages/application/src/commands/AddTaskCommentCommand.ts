/**
 * AddTaskCommentCommand - Adds a comment to a task
 */

import { ITaskRepository } from '@checkmate/domain';

export interface AddTaskCommentCommand {
  taskId: string;
  content: string;
}

export interface AddTaskCommentResult {
  taskId: string;
  commentId: string;
  content: string;
  createdAt: string;
}

export class AddTaskCommentHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: AddTaskCommentCommand): Promise<AddTaskCommentResult> {
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const { task: updatedTask, comment } = task.addComment(command.content);
    await this.taskRepository.save(updatedTask);

    return {
      taskId: updatedTask.id,
      commentId: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString()
    };
  }
}
