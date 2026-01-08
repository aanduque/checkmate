import { Task, TaskId, ITaskRepository } from '@checkmate/domain';

export interface SkipTaskForNowInput {
  taskId: string;
}

export interface SkipTaskForDayInput {
  taskId: string;
  justification: string;
}

export interface ClearSkipStateInput {
  taskId: string;
}

export interface SkipTaskOutput {
  task: ReturnType<Task['toData']>;
}

export class SkipTaskForNowCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: SkipTaskForNowInput): Promise<SkipTaskOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    task.skipForNow();
    await this.taskRepository.save(task);

    return { task: task.toData() };
  }
}

export class SkipTaskForDayCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: SkipTaskForDayInput): Promise<SkipTaskOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    task.skipForDay(input.justification);
    await this.taskRepository.save(task);

    return { task: task.toData() };
  }
}

export class ClearSkipStateCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: ClearSkipStateInput): Promise<SkipTaskOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    task.clearSkipState();
    await this.taskRepository.save(task);

    return { task: task.toData() };
  }
}
