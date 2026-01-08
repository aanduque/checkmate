/**
 * ITaskRepository - Interface for task persistence
 */

import { Task } from '../entities/Task';
import { TaskLocation } from '../value-objects/TaskLocation';

export interface ITaskRepository {
  /**
   * Save a task (create or update)
   */
  save(task: Task): Promise<void>;

  /**
   * Find a task by ID
   */
  findById(id: string): Promise<Task | null>;

  /**
   * Find all tasks
   */
  findAll(): Promise<Task[]>;

  /**
   * Find tasks by location (backlog or specific sprint)
   */
  findByLocation(location: TaskLocation): Promise<Task[]>;

  /**
   * Find recurring templates (tasks with recurrence set)
   */
  findTemplates(): Promise<Task[]>;

  /**
   * Find active tasks (not completed or canceled)
   */
  findActive(): Promise<Task[]>;

  /**
   * Find completed tasks
   */
  findCompleted(): Promise<Task[]>;

  /**
   * Delete a task by ID
   */
  delete(id: string): Promise<void>;
}
