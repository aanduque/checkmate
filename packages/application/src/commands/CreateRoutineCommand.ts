/**
 * CreateRoutineCommand - Creates a new routine
 */

import { IRoutineRepository, Routine } from '@checkmate/domain';

export interface CreateRoutineCommand {
  name: string;
  icon: string;
  color: string;
  priority: number;
  taskFilterExpression: string;
  activationExpression: string;
}

export interface CreateRoutineResult {
  id: string;
  name: string;
  icon: string;
  color: string;
  priority: number;
  taskFilterExpression: string;
  activationExpression: string;
}

export class CreateRoutineHandler {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(command: CreateRoutineCommand): Promise<CreateRoutineResult> {
    const routine = Routine.create({
      name: command.name,
      icon: command.icon,
      color: command.color,
      priority: command.priority,
      taskFilterExpression: command.taskFilterExpression,
      activationExpression: command.activationExpression
    });

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
