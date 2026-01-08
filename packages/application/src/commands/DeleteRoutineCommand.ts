/**
 * DeleteRoutineCommand - Deletes a routine
 */

import { IRoutineRepository } from '@checkmate/domain';

export interface DeleteRoutineCommand {
  routineId: string;
}

export interface DeleteRoutineResult {
  deleted: boolean;
  routineId: string;
}

export class DeleteRoutineHandler {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(command: DeleteRoutineCommand): Promise<DeleteRoutineResult> {
    const routine = await this.routineRepository.findById(command.routineId);
    if (!routine) {
      throw new Error('Routine not found');
    }

    await this.routineRepository.delete(command.routineId);

    return {
      deleted: true,
      routineId: command.routineId
    };
  }
}
