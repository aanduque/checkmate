import { Tag, TagId, ITagRepository } from '@checkmate/domain';

export interface GetTagInput {
  tagId: string;
}

export interface TagOutput {
  tag: ReturnType<Tag['toData']>;
}

export interface TagsOutput {
  tags: ReturnType<Tag['toData']>[];
}

export class GetTagQuery {
  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(input: GetTagInput): Promise<TagOutput | null> {
    const tagId = TagId.fromString(input.tagId);
    const tag = await this.tagRepository.findById(tagId);

    if (!tag) {
      return null;
    }

    return { tag: tag.toData() };
  }
}

export class GetAllTagsQuery {
  constructor(private readonly tagRepository: ITagRepository) {}

  async execute(): Promise<TagsOutput> {
    const tags = await this.tagRepository.findAll();

    // Ensure untagged tag exists
    const untagged = tags.find((t) => t.id.isUntagged());
    if (!untagged) {
      const newUntagged = Tag.createUntagged();
      await this.tagRepository.save(newUntagged);
      tags.unshift(newUntagged);
    }

    return {
      tags: tags.map((t) => t.toData()),
    };
  }
}
