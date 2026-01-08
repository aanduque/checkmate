import {
  ITaskRepository,
  ITagRepository,
  ISprintRepository,
  IRoutineRepository,
} from '@checkmate/domain';

export interface ExportData {
  version: string;
  exportedAt: string;
  tasks: any[];
  tags: any[];
  sprints: any[];
  routines: any[];
  settings?: any;
}

/**
 * Service for exporting all data to JSON
 */
export class JsonExporter {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly tagRepository: ITagRepository,
    private readonly sprintRepository: ISprintRepository,
    private readonly routineRepository: IRoutineRepository
  ) {}

  async export(settings?: any): Promise<ExportData> {
    const [tasks, tags, sprints, routines] = await Promise.all([
      this.taskRepository.findAll(),
      this.tagRepository.findAll(),
      this.sprintRepository.findAll(),
      this.routineRepository.findAll(),
    ]);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: tasks.map((t) => t.toData()),
      tags: tags.map((t) => t.toData()),
      sprints: sprints.map((s) => s.toData()),
      routines: routines.map((r) => r.toData()),
      settings,
    };
  }

  exportToString(data: ExportData): string {
    return JSON.stringify(data, null, 2);
  }
}
