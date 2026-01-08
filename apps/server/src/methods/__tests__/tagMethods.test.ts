/**
 * tagMethods - Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RpcServer } from '../../rpc/RpcServer';
import { registerTagMethods } from '../tagMethods';
import { CreateTagHandler, GetAllTagsHandler } from '@checkmate/application';
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

describe('tagMethods', () => {
  let rpcServer: RpcServer;
  let tagRepository: InMemoryTagRepository;

  beforeEach(() => {
    rpcServer = new RpcServer();
    tagRepository = new InMemoryTagRepository();

    registerTagMethods(rpcServer, {
      createTagHandler: new CreateTagHandler(tagRepository),
      getAllTagsHandler: new GetAllTagsHandler(tagRepository)
    });
  });

  describe('tag.create', () => {
    it('should create a tag', async () => {
      const response = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'tag.create',
        params: {
          name: 'Work',
          icon: '💼',
          color: '#3b82f6',
          defaultCapacity: 21
        },
        id: 1
      });

      expect(response.error).toBeUndefined();
      const result = response.result as { id: string; name: string };
      expect(result.name).toBe('Work');
      expect(result.id).toBeDefined();
    });

    it('should create tag with defaults', async () => {
      const response = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'tag.create',
        params: { name: 'Quick' },
        id: 1
      });

      expect(response.error).toBeUndefined();
      const result = response.result as { icon: string; color: string; defaultCapacity: number };
      expect(result.icon).toBe('📌');
      expect(result.color).toBe('#6b7280');
      expect(result.defaultCapacity).toBe(13);
    });
  });

  describe('tag.getAll', () => {
    it('should return empty array when no tags', async () => {
      const response = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'tag.getAll',
        params: {},
        id: 1
      });

      expect(response.error).toBeUndefined();
      const result = response.result as { tags: unknown[] };
      expect(result.tags).toEqual([]);
    });

    it('should return all tags', async () => {
      // Create tags first
      await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'tag.create',
        params: { name: 'Work' },
        id: 1
      });
      await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'tag.create',
        params: { name: 'Personal' },
        id: 2
      });

      const response = await rpcServer.handle({
        jsonrpc: '2.0',
        method: 'tag.getAll',
        params: {},
        id: 3
      });

      expect(response.error).toBeUndefined();
      const result = response.result as { tags: Array<{ name: string }> };
      expect(result.tags).toHaveLength(2);
      expect(result.tags.map(t => t.name)).toContain('Work');
      expect(result.tags.map(t => t.name)).toContain('Personal');
    });
  });
});
