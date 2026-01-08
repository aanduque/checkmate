/**
 * MoveTaskToBacklogCommand - Moves a task back to backlog
 */

import { ITaskRepository } from '@checkmate/domain';

export interface MoveTaskToBacklogCommand {
  taskId: string;
}

export interface MoveTaskToBacklogResult {
  taskId: string;
  location: 'backlog';
}

export class MoveTaskToBacklogHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: MoveTaskToBacklogCommand): Promise<MoveTaskToBacklogResult> {
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.status.isActive()) {
      throw new Error('Cannot move inactive task');
    }

    const movedTask = task.moveToBacklog();
    await this.taskRepository.save(movedTask);

    return {
      taskId: movedTask.id,
      location: 'backlog'
    };
  }
}
