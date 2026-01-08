/**
 * CompleteTaskCommand - Marks a task as completed
 */

import { ITaskRepository } from '@checkmate/domain';

export interface CompleteTaskCommand {
  taskId: string;
}

export interface CompleteTaskResult {
  id: string;
  status: 'completed';
  completedAt: Date;
}

export class CompleteTaskHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: CompleteTaskCommand): Promise<CompleteTaskResult> {
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Complete the task - this validates that task is active
    const completedTask = task.complete();

    // Persist
    await this.taskRepository.save(completedTask);

    return {
      id: completedTask.id,
      status: 'completed',
      completedAt: completedTask.completedAt!
    };
  }
}
