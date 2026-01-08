/**
 * GetFocusTaskQuery - Gets the current focus task and up next queue
 */

import { ITaskRepository, Task, TaskLocation, TaskOrderingService, Session } from '@checkmate/domain';

export interface GetFocusTaskQuery {
  sprintId: string;
}

export interface SessionDTO {
  id: string;
  startedAt: Date;
  durationMinutes: number;
}

export interface FocusTaskDTO {
  id: string;
  title: string;
  tagPoints: Record<string, number>;
  totalPoints: number;
  activeSession?: SessionDTO;
}

export interface GetFocusTaskResult {
  focusTask: FocusTaskDTO | null;
  upNext: FocusTaskDTO[];
  hiddenCount: number;
}

export class GetFocusTaskHandler {
  constructor(
    private readonly taskRepository: ITaskRepository,
    private readonly orderingService: TaskOrderingService
  ) {}

  async execute(query: GetFocusTaskQuery): Promise<GetFocusTaskResult> {
    const sprintLocation = TaskLocation.sprint(query.sprintId);
    const tasksInSprint = await this.taskRepository.findByLocation(sprintLocation);

    // Filter to active tasks only
    const activeTasks = tasksInSprint.filter(t => t.status.isActive());

    // Get visible and hidden tasks using ordering service
    const focusTask = this.orderingService.getFocusTask(activeTasks);
    const upNextTasks = this.orderingService.getUpNextTasks(activeTasks);

    // Count hidden tasks (skipped for day, not returned)
    const hiddenCount = activeTasks.filter(t =>
      t.skipState?.isForDay() && !t.skipState?.returned
    ).length;

    const toDTO = (task: Task): FocusTaskDTO => {
      const activeSession = task.getActiveSession();
      return {
        id: task.id,
        title: task.title,
        tagPoints: task.tagPoints.toRecord(),
        totalPoints: task.totalPoints,
        activeSession: activeSession ? {
          id: activeSession.id,
          startedAt: activeSession.startedAt,
          durationMinutes: 25 // Default duration
        } : undefined
      };
    };

    return {
      focusTask: focusTask ? toDTO(focusTask) : null,
      upNext: upNextTasks.map(toDTO),
      hiddenCount
    };
  }
}
