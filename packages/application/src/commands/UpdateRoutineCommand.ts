/**
 * UpdateRoutineCommand - Updates a routine
 */

import { IRoutineRepository } from '@checkmate/domain';

export interface UpdateRoutineCommand {
  routineId: string;
  name?: string;
  icon?: string;
  color?: string;
  priority?: number;
  taskFilterExpression?: string;
  activationExpression?: string;
}

export interface UpdateRoutineResult {
  id: string;
  name: string;
  icon: string;
  color: string;
  priority: number;
  taskFilterExpression: string;
  activationExpression: string;
}

export class UpdateRoutineHandler {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(command: UpdateRoutineCommand): Promise<UpdateRoutineResult> {
    let routine = await this.routineRepository.findById(command.routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    if (command.name !== undefined) {
      routine = routine.updateName(command.name);
    }
    if (command.icon !== undefined) {
      routine = routine.updateIcon(command.icon);
    }
    if (command.color !== undefined) {
      routine = routine.updateColor(command.color);
    }
    if (command.priority !== undefined) {
      routine = routine.updatePriority(command.priority);
    }
    if (command.taskFilterExpression !== undefined) {
      routine = routine.updateTaskFilterExpression(command.taskFilterExpression);
    }
    if (command.activationExpression !== undefined) {
      routine = routine.updateActivationExpression(command.activationExpression);
    }

    await this.routineRepository.save(routine);

    return {
      id: routine.id,
      name: routine.name,
      icon: routine.icon,
      color: routine.color,
      priority: routine.priority,
      taskFilterExpression: routine.taskFilterExpression,
      activationExpression: routine.activationExpression
    };
  }
}
