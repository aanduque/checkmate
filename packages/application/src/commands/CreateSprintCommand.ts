/**
 * CreateSprintCommand - Creates a new sprint
 *
 * Note: Sprint entity only requires startDate (must be Sunday).
 * End date is automatically calculated as 6 days later (Saturday).
 */

import { ISprintRepository, Sprint } from '@checkmate/domain';

export interface CreateSprintCommand {
  startDate: string; // ISO date string, must be a Sunday
}

export interface CreateSprintResult {
  id: string;
  startDate: string;
  endDate: string;
}

export class CreateSprintHandler {
  constructor(private readonly sprintRepository: ISprintRepository) {}

  async execute(command: CreateSprintCommand): Promise<CreateSprintResult> {
    const startDate = new Date(command.startDate);

    const sprint = Sprint.create(startDate);

    await this.sprintRepository.save(sprint);

    return {
      id: sprint.id,
      startDate: sprint.startDate.toISOString(),
      endDate: sprint.endDate.toISOString()
    };
  }
}
