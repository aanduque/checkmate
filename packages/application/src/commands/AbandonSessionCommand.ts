/**
 * AbandonSessionCommand - Abandons an active session
 */

import { ITaskRepository, SessionStatus } from '@checkmate/domain';

export interface AbandonSessionCommand {
  taskId: string;
  sessionId: string;
}

export interface AbandonSessionResult {
  taskId: string;
  sessionId: string;
  status: 'abandoned';
}

export class AbandonSessionHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: AbandonSessionCommand): Promise<AbandonSessionResult> {
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    const session = task.sessions.find(s => s.id === command.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.status.isInProgress()) {
      throw new Error('Session is not active');
    }

    // Abandon the session
    const abandonedSession = session.abandon();
    const updatedTask = task.updateSession(command.sessionId, abandonedSession);

    await this.taskRepository.save(updatedTask);

    return {
      taskId: updatedTask.id,
      sessionId: abandonedSession.id,
      status: 'abandoned'
    };
  }
}
