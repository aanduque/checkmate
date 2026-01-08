/**
 * GetCurrentSprintQuery - Gets the currently active sprint
 */

import { ISprintRepository } from '@checkmate/domain';

export interface SprintDTO {
  id: string;
  startDate: string;
  endDate: string;
}

export class GetCurrentSprintHandler {
  constructor(private readonly sprintRepository: ISprintRepository) {}

  async execute(): Promise<SprintDTO | null> {
    const sprint = await this.sprintRepository.findCurrent();

    if (!sprint) {
      return null;
    }

    return {
      id: sprint.id,
      startDate: sprint.startDate.toISOString(),
      endDate: sprint.endDate.toISOString()
    };
  }
}
