import {
  Task,
  TaskId,
  SessionId,
  FocusLevel,
  ITaskRepository,
} from '@checkmate/domain';

export interface StartSessionInput {
  taskId: string;
}

export interface CompleteSessionInput {
  taskId: string;
  sessionId: string;
  focusLevel: string;
  note?: string;
}

export interface AbandonSessionInput {
  taskId: string;
  sessionId: string;
}

export interface AddManualSessionInput {
  taskId: string;
  durationMinutes: number;
  focusLevel: string;
  note?: string;
  date?: string;
}

export interface SessionOutput {
  task: ReturnType<Task['toData']>;
  sessionId: string;
}

export class StartSessionCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: StartSessionInput): Promise<SessionOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    const session = task.startSession();
    await this.taskRepository.save(task);

    return {
      task: task.toData(),
      sessionId: session.id.toString(),
    };
  }
}

export class CompleteSessionCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: CompleteSessionInput): Promise<SessionOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    const sessionId = SessionId.fromString(input.sessionId);
    const focusLevel = FocusLevel.create(input.focusLevel);

    task.completeSession(sessionId, focusLevel, input.note);
    await this.taskRepository.save(task);

    return {
      task: task.toData(),
      sessionId: input.sessionId,
    };
  }
}

export class AbandonSessionCommand {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(input: AbandonSessionInput): Promise<SessionOutput> {
    const taskId = TaskId.fromString(input.taskId);
    const task = await this.taskRepository.findById(taskId);

    if (!task) {
      throw new Error('Task not found');
    }

    const sessionId = SessionId.fromString(input.sessionId);
    task.abandonSession(sessionId);
    await this.taskRepository.save(task);

    return {
      task: task.toData(),
      sessionId: input.sessionId,
    };
  }
}
