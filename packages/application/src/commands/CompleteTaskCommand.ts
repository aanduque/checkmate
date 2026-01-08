import { Task, TaskId, ITaskRepository } from '@checkmate/domain';

export interface CompleteTaskInput {
  taskId: string;
}

export interface CompleteTaskOutput {
  task: ReturnType<Task['toData']>;
}

export class CompleteTaskCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: CompleteTaskInput): Promise<CompleteTaskOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    task.complete();
    await this.taskRepository.save(task);

    return { task: task.toData() };
  }
}
