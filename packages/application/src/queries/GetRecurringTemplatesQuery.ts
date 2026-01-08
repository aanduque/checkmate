/**
 * GetRecurringTemplatesQuery - Returns all recurring task templates
 */

import { ITaskRepository, TaskObject } from '@checkmate/domain';

export interface GetRecurringTemplatesResult {
  templates: TaskObject[];
}

export class GetRecurringTemplatesHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(): Promise<GetRecurringTemplatesResult> {
    const templates = await this.taskRepository.findTemplates();

    return {
      templates: templates.map(t => t.toObject())
    };
  }
}
