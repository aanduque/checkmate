/**
 * MoveTaskToSprintCommand - Moves a task to a sprint
 */

import { ITaskRepository, ISprintRepository } from '@checkmate/domain';

export interface MoveTaskToSprintCommand {
  taskId: string;
  sprintId: string;
}

export interface MoveTaskToSprintResult {
  taskId: string;
  location: 'sprint';
  sprintId: string;
}

export class MoveTaskToSprintHandler {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly sprintRepository: ISprintRepository
  ) {}

  async execute(command: MoveTaskToSprintCommand): Promise<MoveTaskToSprintResult> {
    // Find the task
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Validate task can be moved
    if (task.isRecurringTemplate()) {
      throw new Error('Cannot move recurring template to sprint');
    }

    if (!task.status.isActive()) {
      throw new Error('Cannot move inactive task');
    }

    // Find the sprint
    const sprint = await this.sprintRepository.findById(command.sprintId);
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    // Move the task to the sprint
    const movedTask = task.moveToSprint(sprint.id);

    // Persist
    await this.taskRepository.save(movedTask);

    return {
      taskId: movedTask.id,
      location: 'sprint',
      sprintId: sprint.id
    };
  }
}
