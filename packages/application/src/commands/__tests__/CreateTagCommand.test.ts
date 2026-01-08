/**
 * CreateTagCommand - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTagHandler } from '../CreateTagCommand';
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

describe('CreateTagHandler', () => {
  let handler: CreateTagHandler;
  let repository: InMemoryTagRepository;

  beforeEach(() => {
    repository = new InMemoryTagRepository();
    handler = new CreateTagHandler(repository);
  });

  it('should create a tag with all properties', async () => {
    const result = await handler.execute({
      name: 'Work',
      icon: '💼',
      color: '#3b82f6',
      defaultCapacity: 21
    });

    expect(result.name).toBe('Work');
    expect(result.icon).toBe('💼');
    expect(result.color).toBe('#3b82f6');
    expect(result.defaultCapacity).toBe(21);
    expect(result.id).toBeDefined();
  });

  it('should persist the tag', async () => {
    const result = await handler.execute({
      name: 'Personal',
      icon: '🏠',
      color: '#10b981',
      defaultCapacity: 13
    });

    const saved = await repository.findById(result.id);
    expect(saved).not.toBeNull();
    expect(saved!.name).toBe('Personal');
  });

  it('should reject duplicate tag names', async () => {
    await handler.execute({
      name: 'Work',
      icon: '💼',
      color: '#3b82f6',
      defaultCapacity: 21
    });

    await expect(handler.execute({
      name: 'work', // Same name, different case
      icon: '📝',
      color: '#000000',
      defaultCapacity: 10
    })).rejects.toThrow('Tag with this name already exists');
  });

  it('should use default values when not provided', async () => {
    const result = await handler.execute({
      name: 'Quick'
    });

    expect(result.icon).toBe('📌');
    expect(result.color).toBe('#6b7280');
    expect(result.defaultCapacity).toBe(13);
  });
});
