/**
 * DeleteTaskCommentCommand - Deletes a comment from a task
 */

import { ITaskRepository } from '@checkmate/domain';

export interface DeleteTaskCommentCommand {
  taskId: string;
  commentId: string;
}

export interface DeleteTaskCommentResult {
  taskId: string;
  commentId: string;
}

export class DeleteTaskCommentHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: DeleteTaskCommentCommand): Promise<DeleteTaskCommentResult> {
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const updatedTask = task.removeComment(command.commentId);
    await this.taskRepository.save(updatedTask);

    return {
      taskId: updatedTask.id,
      commentId: command.commentId
    };
  }
}
