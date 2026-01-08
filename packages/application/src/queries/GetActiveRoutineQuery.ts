/**
 * GetActiveRoutineQuery - Returns the currently active routine
 */

import {
  IRoutineRepository,
  RoutineObject,
  ActiveRoutineDeterminer,
  IFilterExpressionEvaluator
} from '@checkmate/domain';

export interface GetActiveRoutineResult {
  routine: RoutineObject | null;
}

export class GetActiveRoutineHandler {
  private readonly determiner: ActiveRoutineDeterminer;

  constructor(
    private readonly routineRepository: IRoutineRepository,
    expressionEvaluator: IFilterExpressionEvaluator
  ) {
    this.determiner = new ActiveRoutineDeterminer(expressionEvaluator);
  }

  async execute(now: Date = new Date()): Promise<GetActiveRoutineResult> {
    const routines = await this.routineRepository.findAll();
    const context = ActiveRoutineDeterminer.buildContext(now);
    const activeRoutine = this.determiner.determine(routines, context);

    return {
      routine: activeRoutine?.toObject() ?? null
    };
  }
}
