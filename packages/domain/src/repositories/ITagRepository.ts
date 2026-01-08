/**
 * ITagRepository - Interface for tag persistence
 */

import { Tag } from '../entities/Tag';

export interface ITagRepository {
  /**
   * Save a tag (create or update)
   */
  save(tag: Tag): Promise<void>;

  /**
   * Find a tag by ID
   */
  findById(id: string): Promise<Tag | null>;

  /**
   * Find all tags
   */
  findAll(): Promise<Tag[]>;

  /**
   * Find a tag by name (case insensitive)
   */
  findByName(name: string): Promise<Tag | null>;

  /**
   * Delete a tag by ID
   */
  delete(id: string): Promise<void>;
}
