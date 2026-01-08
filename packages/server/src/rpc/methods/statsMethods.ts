import { RpcMethod } from '../types';
import { GetStatsQuery } from '@checkmate/application';
import { ITaskRepository, ITagRepository, ISprintRepository } from '@checkmate/domain';

export function createStatsMethods(
  taskRepository: ITaskRepository,
  tagRepository: ITagRepository,
  sprintRepository: ISprintRepository
): Record<string, RpcMethod> {
  return {
    'stats.get': async (params) => {
      const query = new GetStatsQuery(taskRepository, tagRepository, sprintRepository);
      return query.execute(params as any);
    },
  };
}
