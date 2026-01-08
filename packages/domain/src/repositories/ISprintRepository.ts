import { Sprint } from '../entities/Sprint';
import { SprintId } from '../value-objects/SprintId';

/**
 * Repository interface for Sprint aggregate
 */
export interface ISprintRepository {
  save(sprint: Sprint): Promise<void>;
  findById(id: SprintId): Promise<Sprint | null>;
  findAll(): Promise<Sprint[]>;
  findByDate(date: Date): Promise<Sprint | null>;
  findCurrent(today?: Date): Promise<Sprint | null>;
  delete(id: SprintId): Promise<void>;
}
