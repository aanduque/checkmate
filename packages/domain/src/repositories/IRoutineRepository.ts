/**
 * IRoutineRepository - Interface for routine persistence
 */

import { Routine } from '../entities/Routine';

export interface IRoutineRepository {
  /**
   * Save a routine (create or update)
   */
  save(routine: Routine): Promise<void>;

  /**
   * Find a routine by ID
   */
  findById(id: string): Promise<Routine | null>;

  /**
   * Find all routines
   */
  findAll(): Promise<Routine[]>;

  /**
   * Find routines ordered by priority (descending)
   */
  findByPriority(): Promise<Routine[]>;

  /**
   * Delete a routine by ID
   */
  delete(id: string): Promise<void>;
}
