/**
 * GetKanbanBoardQuery - Gets tasks organized by Kanban columns
 */

import { ITaskRepository, ISprintRepository, ITagRepository, Task, TaskLocation } from '@checkmate/domain';

export interface GetKanbanBoardQuery {
  sprintId?: string;
}

export interface TaskDTO {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'canceled';
  tagPoints: Record<string, number>;
  totalPoints: number;
  tags: Array<{ id: string; name: string; color: string }>;
}

export interface GetKanbanBoardResult {
  backlog: TaskDTO[];
  sprint: TaskDTO[];
  completed: TaskDTO[];
}

export class GetKanbanBoardHandler {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly sprintRepository: ISprintRepository,
    private readonly tagRepository: ITagRepository
  ) {}

  async execute(query: GetKanbanBoardQuery): Promise<GetKanbanBoardResult> {
    const allTasks = await this.taskRepository.findAll();
    const allTags = await this.tagRepository.findAll();
    const currentSprint = query.sprintId
      ? await this.sprintRepository.findById(query.sprintId)
      : await this.sprintRepository.findCurrent();

    const tagMap = new Map(allTags.map(t => [t.id, t]));

    const toDTO = (task: Task): TaskDTO => {
      const tagIds = task.tagPoints.tagIds();
      const tags = tagIds.map(id => {
        const tag = tagMap.get(id);
        return tag
          ? { id: tag.id, name: tag.name, color: tag.color }
          : { id, name: id, color: '#888888' };
      });

      return {
        id: task.id,
        title: task.title,
        status: task.status.isCompleted() ? 'completed' :
                task.status.isCanceled() ? 'canceled' : 'active',
        tagPoints: task.tagPoints.toRecord(),
        totalPoints: task.totalPoints,
        tags
      };
    };

    const backlog: TaskDTO[] = [];
    const sprint: TaskDTO[] = [];
    const completed: TaskDTO[] = [];

    for (const task of allTasks) {
      if (task.status.isCompleted() || task.status.isCanceled()) {
        completed.push(toDTO(task));
      } else if (task.location.isBacklog()) {
        backlog.push(toDTO(task));
      } else if (task.location.isSprint()) {
        if (!currentSprint || task.location.sprintId === currentSprint.id) {
          sprint.push(toDTO(task));
        }
      }
    }

    return { backlog, sprint, completed };
  }
}
