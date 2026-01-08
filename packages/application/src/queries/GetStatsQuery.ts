import {
  ITaskRepository,
  ITagRepository,
  ISprintRepository,
  StatsService,
  DailyStats,
  TagPerformance,
  WeeklyStats,
} from '@checkmate/domain';

export interface GetStatsInput {
  sprintId?: string;
}

export interface StatsOutput {
  today: DailyStats;
  tagPerformance: TagPerformance[];
  weekly: WeeklyStats;
  focusQuality: {
    focused: number;
    neutral: number;
    distracted: number;
  };
}

export class GetStatsQuery {
  private readonly statsService = new StatsService();

  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly tagRepository: ITagRepository,
    private readonly sprintRepository: ISprintRepository
  ) {}

  async execute(input: GetStatsInput = {}): Promise<StatsOutput> {
    const tasks = await this.taskRepository.findAll();
    const tags = await this.tagRepository.findAll();

    const today = this.statsService.getTodayStats(tasks);
    const tagPerformance = this.statsService.getTagPerformance(
      tasks,
      tags,
      input.sprintId
    );
    const weekly = this.statsService.getWeeklyStats(tasks);
    const focusQuality = this.statsService.getFocusQuality(tasks);

    return {
      today,
      tagPerformance,
      weekly,
      focusQuality,
    };
  }
}
