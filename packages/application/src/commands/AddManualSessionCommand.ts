/**
 * AddManualSessionCommand - Adds a manual (backdated) session to a task
 */

import { ITaskRepository, Session, FocusLevelType } from '@checkmate/domain';

export interface AddManualSessionCommand {
  taskId: string;
  startedAt: string;
  endedAt: string;
  focusLevel: FocusLevelType;
  note?: string;
}

export interface AddManualSessionResult {
  taskId: string;
  sessionId: string;
  isManual: boolean;
  durationSeconds: number;
}

export class AddManualSessionHandler {
  constructor(private readonly taskRepository: ITaskRepository) {}

  async execute(command: AddManualSessionCommand): Promise<AddManualSessionResult> {
    const task = await this.taskRepository.findById(command.taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.status.isActive()) {
      throw new Error('Cannot add session to inactive task');
    }

    const session = Session.createManual({
      taskId: task.id,
      startedAt: new Date(command.startedAt),
      endedAt: new Date(command.endedAt),
      focusLevel: command.focusLevel,
      note: command.note
    });

    const updatedTask = task.addSession(session);
    await this.taskRepository.save(updatedTask);

    return {
      taskId: updatedTask.id,
      sessionId: session.id,
      isManual: session.isManual,
      durationSeconds: session.durationSeconds
    };
  }
}
