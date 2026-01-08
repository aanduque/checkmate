import { Task, TaskId, ITaskRepository } from '@checkmate/domain';

export interface CancelTaskInput {
  taskId: string;
}

export interface CancelTaskOutput {
  task: ReturnType<Task['toData']>;
}

export class CancelTaskCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: CancelTaskInput): Promise<CancelTaskOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    task.cancel();
    await this.taskRepository.save(task);

    return { task: task.toData() };
  }
}
