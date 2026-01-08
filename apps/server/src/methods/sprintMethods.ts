/**
 * Sprint RPC Methods
 */

import { RpcServer } from '../rpc/RpcServer';
import {
  CreateSprintHandler,
  GetCurrentSprintHandler,
  GetUpcomingSprintsHandler,
  SetSprintCapacityOverrideHandler,
  GetSprintHealthHandler
} from '@checkmate/application';

export interface SprintMethodHandlers {
  createSprintHandler: CreateSprintHandler;
  getCurrentSprintHandler: GetCurrentSprintHandler;
  getUpcomingSprintsHandler: GetUpcomingSprintsHandler;
  setSprintCapacityOverrideHandler: SetSprintCapacityOverrideHandler;
  getSprintHealthHandler: GetSprintHealthHandler;
}

interface CreateSprintParams {
  startDate: string;
}

interface GetUpcomingParams {
  limit?: number;
}

interface SetCapacityParams {
  sprintId: string;
  tagId: string;
  capacity: number;
}

interface GetHealthParams {
  sprintId: string;
}

export function registerSprintMethods(
  server: RpcServer,
  handlers: SprintMethodHandlers
): void {
  const {
    createSprintHandler,
    getCurrentSprintHandler,
    getUpcomingSprintsHandler,
    setSprintCapacityOverrideHandler,
    getSprintHealthHandler
  } = handlers;

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

  // sprint.setCapacity - Set a capacity override for a tag
  server.register('sprint.setCapacity', async (params) => {
    const { sprintId, tagId, capacity } = params as SetCapacityParams;
    return setSprintCapacityOverrideHandler.execute({ sprintId, tagId, capacity });
  });

  // sprint.getHealth - Get sprint health report
  server.register('sprint.getHealth', async (params) => {
    const { sprintId } = params as GetHealthParams;
    return getSprintHealthHandler.execute(sprintId);
  });
}
