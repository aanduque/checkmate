/**
 * GetUpcomingSprintsQuery - Gets upcoming sprints
 */

import { ISprintRepository } from '@checkmate/domain';

export interface GetUpcomingSprintsQuery {
  limit?: number;
}

export interface SprintDTO {
  id: string;
  startDate: string;
  endDate: string;
}

export class GetUpcomingSprintsHandler {
  constructor(private readonly sprintRepository: ISprintRepository) {}

  async execute(query?: GetUpcomingSprintsQuery): Promise<SprintDTO[]> {
    const sprints = await this.sprintRepository.findUpcoming(query?.limit);

    return sprints.map(sprint => ({
      id: sprint.id,
      startDate: sprint.startDate.toISOString(),
      endDate: sprint.endDate.toISOString()
    }));
  }
}
