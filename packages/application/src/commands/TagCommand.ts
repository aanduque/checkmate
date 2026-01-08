import { Tag, TagId, ITagRepository } from '@checkmate/domain';

export interface CreateTagInput {
  name: string;
  description?: string;
  icon: string;
  color: string;
  defaultCapacity: number;
}

export interface UpdateTagInput {
  tagId: string;
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  defaultCapacity?: number;
}

export interface DeleteTagInput {
  tagId: string;
}

export interface TagOutput {
  tag: ReturnType<Tag['toData']>;
}

export class CreateTagCommand {
  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(input: CreateTagInput): Promise<TagOutput> {
    // Check for duplicate name
    const existing = await this.tagRepository.findByName(input.name);
    if (existing) {
      throw new Error('Tag with this name already exists');
    }

    const tag = Tag.create({
      name: input.name,
      description: input.description,
      icon: input.icon,
      color: input.color,
      defaultCapacity: input.defaultCapacity,
    });

    await this.tagRepository.save(tag);

    return { tag: tag.toData() };
  }
}

export class UpdateTagCommand {
  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(input: UpdateTagInput): Promise<TagOutput> {
    const tagId = TagId.fromString(input.tagId);
    const tag = await this.tagRepository.findById(tagId);

    if (!tag) {
      throw new Error('Tag not found');
    }

    if (input.name !== undefined) {
      tag.updateName(input.name);
    }
    if (input.description !== undefined) {
      tag.updateDescription(input.description);
    }
    if (input.icon !== undefined) {
      tag.updateIcon(input.icon);
    }
    if (input.color !== undefined) {
      tag.updateColor(input.color);
    }
    if (input.defaultCapacity !== undefined) {
      tag.updateDefaultCapacity(input.defaultCapacity);
    }

    await this.tagRepository.save(tag);

    return { tag: tag.toData() };
  }
}

export class DeleteTagCommand {
  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(input: DeleteTagInput): Promise<void> {
    const tagId = TagId.fromString(input.tagId);
    const tag = await this.tagRepository.findById(tagId);

    if (!tag) {
      throw new Error('Tag not found');
    }

    if (tag.isSystemTag()) {
      throw new Error('Cannot delete system tag');
    }

    await this.tagRepository.delete(tagId);
  }
}
