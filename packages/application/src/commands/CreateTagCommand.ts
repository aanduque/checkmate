/**
 * CreateTagCommand - Creates a new tag
 */

import { ITagRepository, Tag } from '@checkmate/domain';

export interface CreateTagCommand {
  name: string;
  icon?: string;
  color?: string;
  defaultCapacity?: number;
}

export interface CreateTagResult {
  id: string;
  name: string;
  icon: string;
  color: string;
  defaultCapacity: number;
}

export class CreateTagHandler {
  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(command: CreateTagCommand): Promise<CreateTagResult> {
    // Check for duplicate names
    const existing = await this.tagRepository.findByName(command.name);
    if (existing) {
      throw new Error('Tag with this name already exists');
    }

    const tag = Tag.create({
      name: command.name,
      icon: command.icon ?? '📌',
      color: command.color ?? '#6b7280',
      defaultCapacity: command.defaultCapacity ?? 13
    });

    await this.tagRepository.save(tag);

    return {
      id: tag.id,
      name: tag.name,
      icon: tag.icon,
      color: tag.color,
      defaultCapacity: tag.defaultCapacity
    };
  }
}
