/**
 * GetSprintHealthQuery - Returns the health report for a sprint
 */

import {
  ISprintRepository,
  ITaskRepository,
  ITagRepository,
  SprintHealthCalculator,
  SprintHealthReport
} from '@checkmate/domain';

export interface GetSprintHealthResult {
  health: SprintHealthReport;
}

export class GetSprintHealthHandler {
  private readonly calculator: SprintHealthCalculator;

  constructor(
    private readonly sprintRepository: ISprintRepository,
    private readonly taskRepository: ITaskRepository,
    private readonly tagRepository: ITagRepository
  ) {
    this.calculator = new SprintHealthCalculator();
  }

  async execute(sprintId: string): Promise<GetSprintHealthResult> {
    const sprint = await this.sprintRepository.findById(sprintId);
    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const tasks = await this.taskRepository.findAll();
    const tags = await this.tagRepository.findAll();

    const health = this.calculator.calculateSprintHealth(sprint, tasks, tags);

    return { health };
  }
}
