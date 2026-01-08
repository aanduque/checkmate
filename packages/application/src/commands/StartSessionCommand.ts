/**
 * StartSessionCommand - Starts a focus session for a task
 */

import { ITaskRepository } from '@checkmate/domain';

export interface StartSessionCommand {
  taskId: string;
  durationMinutes?: number;
}

export interface StartSessionResult {
  sessionId: string;
  taskId: string;
  durationMinutes: number;
  startedAt: Date;
}

export class StartSessionHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: StartSessionCommand): Promise<StartSessionResult> {
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const durationMinutes = command.durationMinutes ?? 25;

    // Start session - validates task is active and has no active session
    const { task: taskWithSession, sessionId } = task.startSession(durationMinutes);

    // Persist
    await this.taskRepository.save(taskWithSession);

    const session = taskWithSession.sessions.find(s => s.id === sessionId)!;

    return {
      sessionId,
      taskId: taskWithSession.id,
      durationMinutes,
      startedAt: session.startedAt
    };
  }
}
