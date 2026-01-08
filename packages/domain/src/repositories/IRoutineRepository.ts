import { Routine } from '../entities/Routine';
import { RoutineId } from '../value-objects/RoutineId';

/**
 * Repository interface for Routine aggregate
 */
export interface IRoutineRepository {
  save(routine: Routine): Promise<void>;
  findById(id: RoutineId): Promise<Routine | null>;
  findByName(name: string): Promise<Routine | null>;
  findAll(): Promise<Routine[]>;
  delete(id: RoutineId): Promise<void>;
}
