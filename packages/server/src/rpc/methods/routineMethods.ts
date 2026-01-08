import { RpcMethod, RpcErrorCodes } from '../types';
import {
  CreateRoutineCommand,
  UpdateRoutineCommand,
  DeleteRoutineCommand,
  GetRoutineQuery,
  GetAllRoutinesQuery,
  GetActiveRoutineQuery,
} from '@checkmate/application';
import { IRoutineRepository } from '@checkmate/domain';
import { FilterExpressionEvaluator } from '@checkmate/infrastructure';

export function createRoutineMethods(
  routineRepository: IRoutineRepository,
  filterEvaluator: FilterExpressionEvaluator
): Record<string, RpcMethod> {
  return {
    'routine.create': async (params) => {
      const command = new CreateRoutineCommand(routineRepository);
      return command.execute(params as any);
    },

    'routine.update': async (params) => {
      const command = new UpdateRoutineCommand(routineRepository);
      return command.execute(params as any);
    },

    'routine.delete': async (params) => {
      const command = new DeleteRoutineCommand(routineRepository);
      return command.execute(params as any);
    },

    'routine.get': async (params) => {
      const query = new GetRoutineQuery(routineRepository);
      const result = await query.execute(params as any);
      if (!result) {
        throw { code: RpcErrorCodes.NOT_FOUND, message: 'Routine not found' };
      }
      return result;
    },

    'routine.getAll': async () => {
      const query = new GetAllRoutinesQuery(routineRepository);
      return query.execute();
    },

    'routine.getActive': async (params) => {
      const query = new GetActiveRoutineQuery(routineRepository);
      return query.execute(params as any, (expression, context) =>
        filterEvaluator.evaluateActivationExpression(expression, context)
      );
    },
  };
}
