/**
 * SkipTaskCommand - Skips a task for now or for the day
 */

import { ITaskRepository, SkipState } from '@checkmate/domain';

export interface SkipTaskCommand {
  taskId: string;
  type: 'for_now' | 'for_day';
  justification?: string;
}

export interface SkipTaskResult {
  id: string;
  skipState: {
    type: 'for_now' | 'for_day';
    skippedAt: Date;
    returnAt?: Date;
  };
}

export class SkipTaskHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: SkipTaskCommand): Promise<SkipTaskResult> {
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    let updatedTask;

    if (command.type === 'for_now') {
      updatedTask = task.skipForNow();
    } else {
      // Skip for day requires justification
      if (!command.justification || !command.justification.trim()) {
        throw new Error('Justification is required for skip for day');
      }
      const { task: skippedTask } = task.skipForDay(command.justification);
      updatedTask = skippedTask;
    }

    // Persist
    await this.taskRepository.save(updatedTask);

    const skipState = updatedTask.skipState!;
    return {
      id: updatedTask.id,
      skipState: {
        type: skipState.isForNow() ? 'for_now' : 'for_day',
        skippedAt: skipState.skippedAt,
        returnAt: skipState.returnAt
      }
    };
  }
}
