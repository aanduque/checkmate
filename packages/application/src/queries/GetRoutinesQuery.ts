import {
  Routine,
  RoutineId,
  IRoutineRepository,
  RoutineService,
  RoutineContext,
} from '@checkmate/domain';

export interface GetRoutineInput {
  routineId: string;
}

export interface GetActiveRoutineInput {
  manualRoutineId?: string;
}

export interface RoutineOutput {
  routine: ReturnType<Routine['toData']>;
}

export interface RoutinesOutput {
  routines: ReturnType<Routine['toData']>[];
}

export type ActivationEvaluator = (
  expression: string,
  context: RoutineContext
) => boolean;

export class GetRoutineQuery {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(input: GetRoutineInput): Promise<RoutineOutput | null> {
    const routineId = RoutineId.fromString(input.routineId);
    const routine = await this.routineRepository.findById(routineId);

    if (!routine) {
      return null;
    }

    return { routine: routine.toData() };
  }
}

export class GetAllRoutinesQuery {
  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(): Promise<RoutinesOutput> {
    const routines = await this.routineRepository.findAll();
    return {
      routines: routines.map((r) => r.toData()),
    };
  }
}

export class GetActiveRoutineQuery {
  private readonly routineService = new RoutineService();

  constructor(private readonly routineRepository: IRoutineRepository) {}

  async execute(
    input: GetActiveRoutineInput,
    evaluator?: ActivationEvaluator
  ): Promise<RoutineOutput | null> {
    // If manual routine specified, use that
    if (input.manualRoutineId) {
      const routineId = RoutineId.fromString(input.manualRoutineId);
      const routine = await this.routineRepository.findById(routineId);
      if (routine) {
        return { routine: routine.toData() };
      }
    }

    // Otherwise, determine active routine based on current time
    const routines = await this.routineRepository.findAll();
    const context = this.routineService.buildContext();
    const activeRoutine = this.routineService.determineActiveRoutine(
      routines,
      context,
      evaluator
    );

    if (!activeRoutine) {
      return null;
    }

    return { routine: activeRoutine.toData() };
  }
}
