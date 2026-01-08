/**
 * taskMethods - Register task-related RPC methods
 */

import { RpcServer } from '../rpc/RpcServer';
import {
  CreateTaskHandler,
  CompleteTaskHandler,
  CancelTaskHandler,
  SkipTaskHandler,
  GetKanbanBoardHandler,
  GetFocusTaskHandler
} from '@checkmate/application';

interface TaskMethodHandlers {
  createTaskHandler: CreateTaskHandler;
  completeTaskHandler: CompleteTaskHandler;
  cancelTaskHandler: CancelTaskHandler;
  skipTaskHandler: SkipTaskHandler;
  getKanbanBoardHandler: GetKanbanBoardHandler;
  getFocusTaskHandler: GetFocusTaskHandler;
}

interface CreateTaskParams {
  title: string;
  description?: string;
  tagPoints: Record<string, number>;
  sprintId?: string;
}

interface CompleteTaskParams {
  id: string;
}

interface CancelTaskParams {
  id: string;
  justification: string;
}

interface SkipTaskParams {
  id: string;
  type: 'for_now' | 'for_day';
  justification: string;
}

interface GetKanbanParams {
  sprintId?: string;
}

interface GetFocusParams {
  sprintId?: string;
}

export function registerTaskMethods(
  server: RpcServer,
  handlers: TaskMethodHandlers
): void {
  const {
    createTaskHandler,
    completeTaskHandler,
    cancelTaskHandler,
    skipTaskHandler,
    getKanbanBoardHandler,
    getFocusTaskHandler
  } = handlers;

  server.register('task.create', async (params) => {
    const { title, description, tagPoints, sprintId } = params as CreateTaskParams;
    return createTaskHandler.execute({
      title,
      description,
      tagPoints,
      sprintId
    });
  });

  server.register('task.complete', async (params) => {
    const { id } = params as CompleteTaskParams;
    return completeTaskHandler.execute({ taskId: id });
  });

  server.register('task.cancel', async (params) => {
    const { id, justification } = params as CancelTaskParams;
    return cancelTaskHandler.execute({ taskId: id, justification });
  });

  server.register('task.skip', async (params) => {
    const { id, type, justification } = params as SkipTaskParams;
    return skipTaskHandler.execute({ taskId: id, type, justification });
  });

  server.register('task.getKanban', async (params) => {
    const { sprintId } = (params || {}) as GetKanbanParams;
    return getKanbanBoardHandler.execute({ sprintId });
  });

  server.register('task.getFocus', async (params) => {
    const { sprintId } = (params || {}) as GetFocusParams;
    return getFocusTaskHandler.execute({ sprintId });
  });
}
