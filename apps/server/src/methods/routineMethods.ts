/**
 * routineMethods - Register routine-related RPC methods
 */

import { RpcServer } from '../rpc/RpcServer';
import {
  CreateRoutineHandler,
  UpdateRoutineHandler,
  DeleteRoutineHandler,
  GetAllRoutinesHandler,
  GetActiveRoutineHandler
} from '@checkmate/application';

export interface RoutineMethodHandlers {
  createRoutineHandler: CreateRoutineHandler;
  updateRoutineHandler: UpdateRoutineHandler;
  deleteRoutineHandler: DeleteRoutineHandler;
  getAllRoutinesHandler: GetAllRoutinesHandler;
  getActiveRoutineHandler: GetActiveRoutineHandler;
}

interface CreateRoutineParams {
  name: string;
  icon: string;
  color: string;
  priority: number;
  taskFilterExpression: string;
  activationExpression: string;
}

interface UpdateRoutineParams {
  id: string;
  name?: string;
  icon?: string;
  color?: string;
  priority?: number;
  taskFilterExpression?: string;
  activationExpression?: string;
}

interface DeleteRoutineParams {
  id: string;
}

export function registerRoutineMethods(
  server: RpcServer,
  handlers: RoutineMethodHandlers
): void {
  const {
    createRoutineHandler,
    updateRoutineHandler,
    deleteRoutineHandler,
    getAllRoutinesHandler,
    getActiveRoutineHandler
  } = handlers;

  // routine.create - Create a new routine
  server.register('routine.create', async (params) => {
    const {
      name,
      icon,
      color,
      priority,
      taskFilterExpression,
      activationExpression
    } = params as CreateRoutineParams;

    return createRoutineHandler.execute({
      name,
      icon,
      color,
      priority,
      taskFilterExpression,
      activationExpression
    });
  });

  // routine.update - Update an existing routine
  server.register('routine.update', async (params) => {
    const {
      id,
      name,
      icon,
      color,
      priority,
      taskFilterExpression,
      activationExpression
    } = params as UpdateRoutineParams;

    return updateRoutineHandler.execute({
      routineId: id,
      name,
      icon,
      color,
      priority,
      taskFilterExpression,
      activationExpression
    });
  });

  // routine.delete - Delete a routine
  server.register('routine.delete', async (params) => {
    const { id } = params as DeleteRoutineParams;
    return deleteRoutineHandler.execute({ routineId: id });
  });

  // routine.getAll - Get all routines
  server.register('routine.getAll', async () => {
    return getAllRoutinesHandler.execute();
  });

  // routine.getActive - Get the currently active routine
  server.register('routine.getActive', async () => {
    return getActiveRoutineHandler.execute();
  });
}
