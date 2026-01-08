/**
 * Sprint RPC Methods
 */

import { RpcServer } from '../rpc/RpcServer';
import {
  CreateSprintHandler,
  GetCurrentSprintHandler,
  GetUpcomingSprintsHandler
} from '@checkmate/application';

export interface SprintMethodHandlers {
  createSprintHandler: CreateSprintHandler;
  getCurrentSprintHandler: GetCurrentSprintHandler;
  getUpcomingSprintsHandler: GetUpcomingSprintsHandler;
}

interface CreateSprintParams {
  startDate: string;
}

interface GetUpcomingParams {
  limit?: number;
}

export function registerSprintMethods(
  server: RpcServer,
  handlers: SprintMethodHandlers
): void {
  const { createSprintHandler, getCurrentSprintHandler, getUpcomingSprintsHandler } = handlers;

  // sprint.create - Create a new sprint
  server.register('sprint.create', async (params) => {
    const { startDate } = params as CreateSprintParams;
    return createSprintHandler.execute({ startDate });
  });

  // sprint.getCurrent - Get the currently active sprint
  server.register('sprint.getCurrent', async () => {
    return getCurrentSprintHandler.execute();
  });

  // sprint.getUpcoming - Get upcoming sprints
  server.register('sprint.getUpcoming', async (params) => {
    const { limit } = (params || {}) as GetUpcomingParams;
    return getUpcomingSprintsHandler.execute({ limit });
  });
}
