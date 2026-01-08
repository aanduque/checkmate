import { Task, ITaskRepository } from '@checkmate/domain';

export interface CreateTaskInput {
  title: string;
  description?: string;
  tagPoints: Record<string, number>;
  recurrence?: string;
}

export interface CreateTaskOutput {
  task: ReturnType<Task['toData']>;
}

export class CreateTaskCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: CreateTaskInput): Promise<CreateTaskOutput> {
    const task = Task.create({
      title: input.title,
      description: input.description,
      tagPoints: input.tagPoints,
      recurrence: input.recurrence,
    });

    await this.taskRepository.save(task);

    return { task: task.toData() };
  }
}
