import { RpcMethod, RpcErrorCodes } from '../types';
import {
  SetSprintCapacityOverrideCommand,
  ClearSprintCapacityOverrideCommand,
  GetSprintQuery,
  GetAllSprintsQuery,
  GetCurrentSprintQuery,
  GetSprintHealthQuery,
} from '@checkmate/application';
import { ISprintRepository, ITaskRepository, ITagRepository } from '@checkmate/domain';

export function createSprintMethods(
  sprintRepository: ISprintRepository,
  taskRepository: ITaskRepository,
  tagRepository: ITagRepository
): Record<string, RpcMethod> {
  return {
    'sprint.setCapacityOverride': async (params) => {
      const command = new SetSprintCapacityOverrideCommand(sprintRepository);
      return command.execute(params as any);
    },

    'sprint.clearCapacityOverride': async (params) => {
      const command = new ClearSprintCapacityOverrideCommand(sprintRepository);
      return command.execute(params as any);
    },

    'sprint.get': async (params) => {
      const query = new GetSprintQuery(sprintRepository);
      const result = await query.execute(params as any);
      if (!result) {
        throw { code: RpcErrorCodes.NOT_FOUND, message: 'Sprint not found' };
      }
      return result;
    },

    'sprint.getAll': async () => {
      const query = new GetAllSprintsQuery(sprintRepository);
      return query.execute();
    },

    'sprint.getCurrent': async () => {
      const query = new GetCurrentSprintQuery(sprintRepository);
      return query.execute();
    },

    'sprint.getHealth': async (params) => {
      const query = new GetSprintHealthQuery(
        sprintRepository,
        taskRepository,
        tagRepository
      );
      const result = await query.execute(params as any);
      if (!result) {
        throw { code: RpcErrorCodes.NOT_FOUND, message: 'Sprint not found' };
      }
      return result;
    },
  };
}
