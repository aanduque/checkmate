import { RpcMethod, RpcErrorCodes } from '../types';
import {
  CreateTagCommand,
  UpdateTagCommand,
  DeleteTagCommand,
  GetTagQuery,
  GetAllTagsQuery,
} from '@checkmate/application';
import { ITagRepository } from '@checkmate/domain';

export function createTagMethods(
  tagRepository: ITagRepository
): Record<string, RpcMethod> {
  return {
    'tag.create': async (params) => {
      const command = new CreateTagCommand(tagRepository);
      return command.execute(params as any);
    },

    'tag.update': async (params) => {
      const command = new UpdateTagCommand(tagRepository);
      return command.execute(params as any);
    },

    'tag.delete': async (params) => {
      const command = new DeleteTagCommand(tagRepository);
      return command.execute(params as any);
    },

    'tag.get': async (params) => {
      const query = new GetTagQuery(tagRepository);
      const result = await query.execute(params as any);
      if (!result) {
        throw { code: RpcErrorCodes.NOT_FOUND, message: 'Tag not found' };
      }
      return result;
    },

    'tag.getAll': async () => {
      const query = new GetAllTagsQuery(tagRepository);
      return query.execute();
    },
  };
}
