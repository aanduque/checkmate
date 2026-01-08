/**
 * GetAllRoutinesQuery - Returns all routines
 */

import { IRoutineRepository, RoutineObject } from '@checkmate/domain';

export interface GetAllRoutinesResult {
  routines: RoutineObject[];
}

export class GetAllRoutinesHandler {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(): Promise<GetAllRoutinesResult> {
    const routines = await this.routineRepository.findAll();

    return {
      routines: routines.map(r => r.toObject())
    };
  }
}
