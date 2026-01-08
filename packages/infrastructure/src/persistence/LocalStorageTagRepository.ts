/**
 * LocalStorageTagRepository - Persists tags to localStorage
 */

import { ITagRepository, Tag, TagObject } from '@checkmate/domain';

const STORAGE_KEY = 'checkmate_tags';

export class LocalStorageTagRepository implements ITagRepository {
  constructor(private readonly storage: Storage) {}

  private loadAll(): Record<string, TagObject> {
    const data = this.storage.getItem(STORAGE_KEY);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private saveAll(tags: Record<string, TagObject>): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(tags));
  }

  async save(tag: Tag): Promise<void> {
    const tags = this.loadAll();
    tags[tag.id] = tag.toObject();
    this.saveAll(tags);
  }

  async findById(id: string): Promise<Tag | null> {
    const tags = this.loadAll();
    const tagData = tags[id];
    if (!tagData) return null;
    return Tag.fromObject(tagData);
  }

  async findByName(name: string): Promise<Tag | null> {
    const all = await this.findAll();
    const lowerName = name.toLowerCase();
    return all.find(tag => tag.name.toLowerCase() === lowerName) || null;
  }

  async findAll(): Promise<Tag[]> {
    const tags = this.loadAll();
    return Object.values(tags).map(data => Tag.fromObject(data));
  }

  async delete(id: string): Promise<void> {
    const tags = this.loadAll();
    delete tags[id];
    this.saveAll(tags);
  }
}
