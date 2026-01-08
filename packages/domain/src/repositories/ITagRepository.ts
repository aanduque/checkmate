import { Tag } from '../entities/Tag';
import { TagId } from '../value-objects/TagId';

/**
 * Repository interface for Tag aggregate
 */
export interface ITagRepository {
  save(tag: Tag): Promise<void>;
  findById(id: TagId): Promise<Tag | null>;
  findByName(name: string): Promise<Tag | null>;
  findAll(): Promise<Tag[]>;
  delete(id: TagId): Promise<void>;
}
