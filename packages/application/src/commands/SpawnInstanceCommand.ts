import { Task, TaskId, ITaskRepository } from '@checkmate/domain';

export interface SpawnInstanceInput {
  templateId: string;
}

export interface SpawnInstanceOutput {
  task: ReturnType<Task['toData']>;
}

export class SpawnInstanceCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: SpawnInstanceInput): Promise<SpawnInstanceOutput> {
    const templateId = TaskId.fromString(input.templateId);
    const template = await this.taskRepository.findById(templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    if (!template.isRecurringTemplate()) {
      throw new Error('Task is not a recurring template');
    }

    const instance = template.spawnInstance();
    await this.taskRepository.save(instance);

    return { task: instance.toData() };
  }
}
