/**
 * CreateTaskCommand - Creates a new task
 */

import { ITaskRepository, Task } from '@checkmate/domain';

export interface CreateTaskCommand {
  title: string;
  description?: string;
  tagPoints: Record<string, number>;
  sprintId?: string;
}

export interface CreateTaskResult {
  id: string;
  title: string;
  tagPoints: Record<string, number>;
  totalPoints: number;
  location: 'backlog' | 'sprint';
  sprintId?: string;
}

export class CreateTaskHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: CreateTaskCommand): Promise<CreateTaskResult> {
    // Create the task - this will validate Fibonacci points
    let task = Task.create({
      title: command.title,
      description: command.description,
      tagPoints: command.tagPoints
    });

    // Move to sprint if specified
    if (command.sprintId) {
      task = task.moveToSprint(command.sprintId);
    }

    // Persist the task
    await this.taskRepository.save(task);

    return {
      id: task.id,
      title: task.title,
      tagPoints: task.tagPoints.toRecord(),
      totalPoints: task.totalPoints,
      location: task.location.isSprint() ? 'sprint' : 'backlog',
      sprintId: task.location.sprintId || undefined
    };
  }
}
