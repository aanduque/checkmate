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
  GetFocusTaskHandler,
  UpdateTaskHandler,
  MoveTaskToSprintHandler,
  MoveTaskToBacklogHandler,
  AddTaskCommentHandler,
  DeleteTaskCommentHandler,
  GetRecurringTemplatesHandler
} from '@checkmate/application';

export interface TaskMethodHandlers {
  createTaskHandler: CreateTaskHandler;
  completeTaskHandler: CompleteTaskHandler;
  cancelTaskHandler: CancelTaskHandler;
  skipTaskHandler: SkipTaskHandler;
  getKanbanBoardHandler: GetKanbanBoardHandler;
  getFocusTaskHandler: GetFocusTaskHandler;
  updateTaskHandler: UpdateTaskHandler;
  moveTaskToSprintHandler: MoveTaskToSprintHandler;
  moveTaskToBacklogHandler: MoveTaskToBacklogHandler;
  addTaskCommentHandler: AddTaskCommentHandler;
  deleteTaskCommentHandler: DeleteTaskCommentHandler;
  getRecurringTemplatesHandler: GetRecurringTemplatesHandler;
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

interface UpdateTaskParams {
  id: string;
  title?: string;
  description?: string;
  tagPoints?: Record<string, number>;
}

interface MoveTaskParams {
  id: string;
  sprintId?: string;
}

interface AddCommentParams {
  taskId: string;
  content: string;
}

interface DeleteCommentParams {
  taskId: string;
  commentId: string;
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
    getFocusTaskHandler,
    updateTaskHandler,
    moveTaskToSprintHandler,
    moveTaskToBacklogHandler,
    addTaskCommentHandler,
    deleteTaskCommentHandler,
    getRecurringTemplatesHandler
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

  // task.update - Update task fields
  server.register('task.update', async (params) => {
    const { id, title, description, tagPoints } = params as UpdateTaskParams;
    return updateTaskHandler.execute({
      taskId: id,
      title,
      description,
      tagPoints
    });
  });

  // task.move - Move task to sprint or backlog
  server.register('task.move', async (params) => {
    const { id, sprintId } = params as MoveTaskParams;
    if (sprintId) {
      return moveTaskToSprintHandler.execute({ taskId: id, sprintId });
    } else {
      return moveTaskToBacklogHandler.execute({ taskId: id });
    }
  });

  // task.addComment - Add a comment to a task
  server.register('task.addComment', async (params) => {
    const { taskId, content } = params as AddCommentParams;
    return addTaskCommentHandler.execute({ taskId, content });
  });

  // task.deleteComment - Delete a comment from a task
  server.register('task.deleteComment', async (params) => {
    const { taskId, commentId } = params as DeleteCommentParams;
    return deleteTaskCommentHandler.execute({ taskId, commentId });
  });

  // task.getRecurringTemplates - Get all recurring task templates
  server.register('task.getRecurringTemplates', async () => {
    return getRecurringTemplatesHandler.execute();
  });
}
