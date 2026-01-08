/**
 * tagMethods - Register tag-related RPC methods
 */

import { RpcServer } from '../rpc/RpcServer';
import { CreateTagHandler, GetAllTagsHandler } from '@checkmate/application';

interface TagMethodHandlers {
  createTagHandler: CreateTagHandler;
  getAllTagsHandler: GetAllTagsHandler;
}

interface CreateTagParams {
  name: string;
  icon?: string;
  color?: string;
  defaultCapacity?: number;
}

export function registerTagMethods(
  server: RpcServer,
  handlers: TagMethodHandlers
): void {
  const { createTagHandler, getAllTagsHandler } = handlers;

  server.register('tag.create', async (params) => {
    const { name, icon, color, defaultCapacity } = params as CreateTagParams;
    return createTagHandler.execute({ name, icon, color, defaultCapacity });
  });

  server.register('tag.getAll', async () => {
    return getAllTagsHandler.execute();
  });
}
