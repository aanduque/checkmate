import {
  Sprint,
  SprintId,
  ISprintRepository,
  ITaskRepository,
  ITagRepository,
  SprintHealthService,
  SprintHealthReport,
  SprintService,
} from '@checkmate/domain';

export interface GetSprintInput {
  sprintId: string;
}

export interface SprintOutput {
  sprint: ReturnType<Sprint['toData']>;
}

export interface SprintsOutput {
  sprints: ReturnType<Sprint['toData']>[];
}

export interface SprintWithHealthOutput {
  sprint: ReturnType<Sprint['toData']>;
  health: SprintHealthReport;
  label: string;
  icon: string;
}

export class GetSprintQuery {
  constructor(private readonly sprintRepository: ISprintRepository) {}

  async execute(input: GetSprintInput): Promise<SprintOutput | null> {
    const sprintId = SprintId.fromString(input.sprintId);
    const sprint = await this.sprintRepository.findById(sprintId);

    if (!sprint) {
      return null;
    }

    return { sprint: sprint.toData() };
  }
}

export class GetAllSprintsQuery {
  private readonly sprintService = new SprintService();

  constructor(private readonly sprintRepository: ISprintRepository) {}

  async execute(): Promise<SprintsOutput> {
    let sprints = await this.sprintRepository.findAll();

    // Ensure required sprints exist
    const newSprints = this.sprintService.ensureSprintsExist(sprints);
    for (const sprint of newSprints) {
      await this.sprintRepository.save(sprint);
      sprints.push(sprint);
    }

    // Sort by start date
    sprints.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // Keep only current + next 2
    const today = new Date();
    const currentIndex = sprints.findIndex((s) => s.containsDate(today));
    if (currentIndex >= 0) {
      sprints = sprints.slice(currentIndex, currentIndex + 3);
    }

    return {
      sprints: sprints.map((s) => s.toData()),
    };
  }
}

export class GetCurrentSprintQuery {
  constructor(private readonly sprintRepository: ISprintRepository) {}

  async execute(): Promise<SprintOutput | null> {
    const sprint = await this.sprintRepository.findCurrent();

    if (!sprint) {
      return null;
    }

    return { sprint: sprint.toData() };
  }
}

export class GetSprintHealthQuery {
  private readonly healthService = new SprintHealthService();
  private readonly sprintService = new SprintService();

  constructor(
    private readonly sprintRepository: ISprintRepository,
    private readonly taskRepository: ITaskRepository,
    private readonly tagRepository: ITagRepository
  ) {}

  async execute(
    input: GetSprintInput
  ): Promise<SprintWithHealthOutput | null> {
    const sprintId = SprintId.fromString(input.sprintId);
    const sprint = await this.sprintRepository.findById(sprintId);

    if (!sprint) {
      return null;
    }

    const tasks = await this.taskRepository.findBySprintId(sprintId);
    const tags = await this.tagRepository.findAll();
    const allSprints = await this.sprintRepository.findAll();
    allSprints.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    const index = allSprints.findIndex((s) => s.id.equals(sprintId));
    const health = this.healthService.calculate(sprint, tasks, tags);

    return {
      sprint: sprint.toData(),
      health,
      label: this.sprintService.getSprintLabel(index),
      icon: this.sprintService.getSprintIcon(index),
    };
  }
}
