/**
 * UpdateTaskCommand - Updates task fields (title, description, tagPoints)
 */

import { ITaskRepository } from '@checkmate/domain';

export interface UpdateTaskCommand {
  taskId: string;
  title?: string;
  description?: string;
  tagPoints?: Record<string, number>;
}

export interface UpdateTaskResult {
  taskId: string;
  title: string;
  description: string;
  tagPoints: Record<string, number>;
  totalPoints: number;
}

export class UpdateTaskHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: UpdateTaskCommand): Promise<UpdateTaskResult> {
    let task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.status.isActive()) {
      throw new Error('Cannot update inactive task');
    }

    // Apply updates
    if (command.title !== undefined) {
      task = task.updateTitle(command.title);
    }

    if (command.description !== undefined) {
      task = task.updateDescription(command.description);
    }

    if (command.tagPoints !== undefined) {
      // Replace all tag points
      const currentTags = task.tagPoints.getTags();
      for (const tagId of currentTags) {
        if (!(tagId in command.tagPoints)) {
          task = task.removeTag(tagId);
        }
      }
      for (const [tagId, points] of Object.entries(command.tagPoints)) {
        task = task.addTag(tagId, points);
      }
    }

    await this.taskRepository.save(task);

    return {
      taskId: task.id,
      title: task.title,
      description: task.description,
      tagPoints: task.tagPoints.toRecord(),
      totalPoints: task.totalPoints
    };
  }
}
