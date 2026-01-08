/**
 * CancelTaskCommand - Cancels a task with required justification
 */

import { ITaskRepository } from '@checkmate/domain';

export interface CancelTaskCommand {
  taskId: string;
  justification: string;
}

export interface CancelTaskResult {
  id: string;
  status: 'canceled';
  canceledAt: Date;
}

export class CancelTaskHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: CancelTaskCommand): Promise<CancelTaskResult> {
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Cancel the task with justification - validates active state and non-empty justification
    const { task: canceledTask } = task.cancel(command.justification);

    // Persist
    await this.taskRepository.save(canceledTask);

    return {
      id: canceledTask.id,
      status: 'canceled',
      canceledAt: canceledTask.canceledAt!
    };
  }
}
