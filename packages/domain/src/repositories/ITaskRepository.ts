import { Task } from '../entities/Task';
import { TaskId } from '../value-objects/TaskId';
import { SprintId } from '../value-objects/SprintId';

/**
 * Repository interface for Task aggregate
 */
export interface ITaskRepository {
  save(task: Task): Promise<void>;
  findById(id: TaskId): Promise<Task | null>;
  findAll(): Promise<Task[]>;
  findBySprintId(sprintId: SprintId): Promise<Task[]>;
  findInBacklog(): Promise<Task[]>;
  findTemplates(): Promise<Task[]>;
  findByParentId(parentId: TaskId): Promise<Task[]>;
  findActive(): Promise<Task[]>;
  findCompleted(): Promise<Task[]>;
  delete(id: TaskId): Promise<void>;
}
