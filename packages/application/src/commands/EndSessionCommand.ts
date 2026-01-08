/**
 * EndSessionCommand - Ends a focus session with focus level
 */

import { ITaskRepository, FocusLevel, FocusLevelType } from '@checkmate/domain';

export interface EndSessionCommand {
  taskId: string;
  sessionId: string;
  focusLevel: FocusLevelType;
}

export interface EndSessionResult {
  sessionId: string;
  status: 'completed';
  focusLevel: FocusLevelType;
  durationSeconds: number;
}

export class EndSessionHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: EndSessionCommand): Promise<EndSessionResult> {
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // End session - validates session exists and is active
    const focusLevel = FocusLevel.create(command.focusLevel);
    const updatedTask = task.endSession(command.sessionId, focusLevel);

    // Persist
    await this.taskRepository.save(updatedTask);

    const session = updatedTask.sessions.find(s => s.id === command.sessionId)!;

    return {
      sessionId: session.id,
      status: 'completed',
      focusLevel: session.focusLevel!.value,
      durationSeconds: session.durationSeconds
    };
  }
}
