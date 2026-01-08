import { RpcMethod, RpcErrorCodes } from '../types';
import {
  CreateTaskCommand,
  CompleteTaskCommand,
  CancelTaskCommand,
  MoveTaskToSprintCommand,
  MoveTaskToBacklogCommand,
  SkipTaskForNowCommand,
  SkipTaskForDayCommand,
  ClearSkipStateCommand,
  StartSessionCommand,
  CompleteSessionCommand,
  AbandonSessionCommand,
  AddManualSessionCommand,
  SpawnInstanceCommand,
  UpdateTaskCommand,
  AddCommentCommand,
  DeleteCommentCommand,
  GetTaskQuery,
  GetTasksQuery,
  GetBacklogTasksQuery,
  GetRecurringTemplatesQuery,
  GetCompletedTasksQuery,
} from '@checkmate/application';
import { ITaskRepository, ISprintRepository } from '@checkmate/domain';

export function createTaskMethods(
  taskRepository: ITaskRepository,
  sprintRepository: ISprintRepository
): Record<string, RpcMethod> {
  return {
    'task.create': async (params) => {
      const command = new CreateTaskCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.complete': async (params) => {
      const command = new CompleteTaskCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.cancel': async (params) => {
      const command = new CancelTaskCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.moveToSprint': async (params) => {
      const command = new MoveTaskToSprintCommand(taskRepository, sprintRepository);
      return command.execute(params as any);
    },

    'task.moveToBacklog': async (params) => {
      const command = new MoveTaskToBacklogCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.skipForNow': async (params) => {
      const command = new SkipTaskForNowCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.skipForDay': async (params) => {
      const command = new SkipTaskForDayCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.clearSkipState': async (params) => {
      const command = new ClearSkipStateCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.startSession': async (params) => {
      const command = new StartSessionCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.completeSession': async (params) => {
      const command = new CompleteSessionCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.abandonSession': async (params) => {
      const command = new AbandonSessionCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.spawnInstance': async (params) => {
      const command = new SpawnInstanceCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.addManualSession': async (params) => {
      const command = new AddManualSessionCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.update': async (params) => {
      const command = new UpdateTaskCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.addComment': async (params) => {
      const command = new AddCommentCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.deleteComment': async (params) => {
      const command = new DeleteCommentCommand(taskRepository);
      return command.execute(params as any);
    },

    'task.get': async (params) => {
      const query = new GetTaskQuery(taskRepository);
      const result = await query.execute(params as any);
      if (!result) {
        throw { code: RpcErrorCodes.NOT_FOUND, message: 'Task not found' };
      }
      return result;
    },

    'task.getAll': async (params) => {
      const query = new GetTasksQuery(taskRepository);
      return query.execute(params as any);
    },

    'task.getBacklog': async () => {
      const query = new GetBacklogTasksQuery(taskRepository);
      return query.execute();
    },

    'task.getTemplates': async () => {
      const query = new GetRecurringTemplatesQuery(taskRepository);
      return query.execute();
    },

    'task.getCompleted': async () => {
      const query = new GetCompletedTasksQuery(taskRepository);
      return query.execute();
    },
  };
}
