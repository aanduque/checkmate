/**
 * GetAllTagsQuery - Returns all tags
 */

import { ITagRepository } from '@checkmate/domain';

export interface TagDTO {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultCapacity: number;
}

export interface GetAllTagsResult {
  tags: TagDTO[];
}

export class GetAllTagsHandler {
  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(): Promise<GetAllTagsResult> {
    const tags = await this.tagRepository.findAll();

    return {
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        icon: tag.icon,
        color: tag.color,
        defaultCapacity: tag.defaultCapacity
      }))
    };
  }
}
