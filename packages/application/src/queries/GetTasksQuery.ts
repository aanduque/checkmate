import {
  Task,
  TaskId,
  SprintId,
  ITaskRepository,
  TaskService,
  TagId,
} from '@checkmate/domain';

export interface GetTaskInput {
  taskId: string;
}

export interface GetTasksInput {
  sprintId?: string;
  inBacklog?: boolean;
  status?: 'active' | 'completed' | 'canceled';
  tagIds?: string[];
}

export interface TaskOutput {
  task: ReturnType<Task['toData']>;
}

export interface TasksOutput {
  tasks: ReturnType<Task['toData']>[];
}

export class GetTaskQuery {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: GetTaskInput): Promise<TaskOutput | null> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      return null;
    }

    return { task: task.toData() };
  }
}

export class GetTasksQuery {
  private readonly taskService = new TaskService();

  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: GetTasksInput = {}): Promise<TasksOutput> {
    let tasks: Task[];

    if (input.sprintId) {
      const sprintId = SprintId.fromString(input.sprintId);
      tasks = await this.taskRepository.findBySprintId(sprintId);
    } else if (input.inBacklog) {
      tasks = await this.taskRepository.findInBacklog();
    } else if (input.status === 'active') {
      tasks = await this.taskRepository.findActive();
    } else if (input.status === 'completed' || input.status === 'canceled') {
      tasks = await this.taskRepository.findCompleted();
      if (input.status) {
        tasks = tasks.filter((t) => t.status === input.status);
      }
    } else {
      tasks = await this.taskRepository.findAll();
    }

    // Filter by tags if specified
    if (input.tagIds && input.tagIds.length > 0) {
      const tagIdObjs = input.tagIds.map((id) => TagId.fromString(id));
      tasks = tasks.filter((t) =>
        this.taskService.taskMatchesTagFilter(t, tagIdObjs)
      );
    }

    return {
      tasks: tasks.map((t) => t.toData()),
    };
  }
}

export class GetBacklogTasksQuery {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(): Promise<TasksOutput> {
    const tasks = await this.taskRepository.findInBacklog();
    return {
      tasks: tasks
        .filter((t) => t.isActive() && !t.isRecurringTemplate())
        .map((t) => t.toData()),
    };
  }
}

export class GetRecurringTemplatesQuery {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(): Promise<TasksOutput> {
    const tasks = await this.taskRepository.findTemplates();
    return {
      tasks: tasks.filter((t) => t.isActive()).map((t) => t.toData()),
    };
  }
}

export class GetCompletedTasksQuery {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(): Promise<TasksOutput> {
    const tasks = await this.taskRepository.findCompleted();
    return {
      tasks: tasks.map((t) => t.toData()),
    };
  }
}
