/**
 * ICommentRepository - Interface for comment persistence
 */

import { Comment } from '../entities/Comment';

export interface ICommentRepository {
  /**
   * Save a comment (create or update)
   */
  save(comment: Comment): Promise<void>;

  /**
   * Find a comment by ID
   */
  findById(id: string): Promise<Comment | null>;

  /**
   * Find all comments for a task
   */
  findByTaskId(taskId: string): Promise<Comment[]>;

  /**
   * Delete a comment by ID
   */
  delete(id: string): Promise<void>;
}
