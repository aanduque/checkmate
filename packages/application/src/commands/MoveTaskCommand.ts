import {
  Task,
  TaskId,
  SprintId,
  ITaskRepository,
  ISprintRepository,
} from '@checkmate/domain';

export interface MoveTaskToSprintInput {
  taskId: string;
  sprintId: string;
}

export interface MoveTaskToBacklogInput {
  taskId: string;
}

export interface MoveTaskOutput {
  task: ReturnType<Task['toData']>;
}

export class MoveTaskToSprintCommand {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly sprintRepository: ISprintRepository
  ) {}

  async execute(input: MoveTaskToSprintInput): Promise<MoveTaskOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const sprintId = SprintId.fromString(input.sprintId);

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const sprint = await this.sprintRepository.findById(sprintId);
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    task.moveToSprint(sprintId);
    await this.taskRepository.save(task);

    return { task: task.toData() };
  }
}

export class MoveTaskToBacklogCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: MoveTaskToBacklogInput): Promise<MoveTaskOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    task.moveToBacklog();
    await this.taskRepository.save(task);

    return { task: task.toData() };
  }
}
