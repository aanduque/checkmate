/**
 * GetAllTagsQuery - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GetAllTagsHandler } from '../GetAllTagsQuery';
import { Tag, ITagRepository } from '@checkmate/domain';

class InMemoryTagRepository implements ITagRepository {
  private tags: Map<string, Tag> = new Map();

  async save(tag: Tag): Promise<void> {
    this.tags.set(tag.id, tag);
  }

  async findById(id: string): Promise<Tag | null> {
    return this.tags.get(id) || null;
  }

  async findByName(name: string): Promise<Tag | null> {
    const lowerName = name.toLowerCase();
    return Array.from(this.tags.values()).find(t =>
      t.name.toLowerCase() === lowerName
    ) || null;
  }

  async findAll(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async delete(id: string): Promise<void> {
    this.tags.delete(id);
  }
}

describe('GetAllTagsHandler', () => {
  let handler: GetAllTagsHandler;
  let repository: InMemoryTagRepository;

  beforeEach(() => {
    repository = new InMemoryTagRepository();
    handler = new GetAllTagsHandler(repository);
  });

  it('should return empty array when no tags exist', async () => {
    const result = await handler.execute();
    expect(result.tags).toEqual([]);
  });

  it('should return all tags', async () => {
    const work = Tag.create({
      name: 'Work',
      icon: '💼',
      color: '#3b82f6',
      defaultCapacity: 21
    });
    const personal = Tag.create({
      name: 'Personal',
      icon: '🏠',
      color: '#10b981',
      defaultCapacity: 13
    });

    await repository.save(work);
    await repository.save(personal);

    const result = await handler.execute();

    expect(result.tags).toHaveLength(2);
    expect(result.tags.map(t => t.name)).toContain('Work');
    expect(result.tags.map(t => t.name)).toContain('Personal');
  });

  it('should return tag DTOs with all properties', async () => {
    const tag = Tag.create({
      name: 'Health',
      icon: '💪',
      color: '#ef4444',
      defaultCapacity: 8
    });
    await repository.save(tag);

    const result = await handler.execute();

    expect(result.tags[0]).toEqual({
      id: tag.id,
      name: 'Health',
      icon: '💪',
      color: '#ef4444',
      defaultCapacity: 8
    });
  });
});
