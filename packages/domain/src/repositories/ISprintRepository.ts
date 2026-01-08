/**
 * ISprintRepository - Interface for sprint persistence
 */

import { Sprint } from '../entities/Sprint';

export interface ISprintRepository {
  /**
   * Save a sprint (create or update)
   */
  save(sprint: Sprint): Promise<void>;

  /**
   * Find a sprint by ID
   */
  findById(id: string): Promise<Sprint | null>;

  /**
   * Find all sprints
   */
  findAll(): Promise<Sprint[]>;

  /**
   * Find the current sprint (active right now)
   */
  findCurrent(): Promise<Sprint | null>;

  /**
   * Find upcoming sprints (ordered by start date)
   */
  findUpcoming(limit?: number): Promise<Sprint[]>;

  /**
   * Delete a sprint by ID
   */
  delete(id: string): Promise<void>;
}
