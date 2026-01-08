/**
 * LocalStorageRoutineRepository - Persists routines to localStorage
 */

import { IRoutineRepository, Routine, RoutineObject } from '@checkmate/domain';

const STORAGE_KEY = 'checkmate_routines';

export class LocalStorageRoutineRepository implements IRoutineRepository {
  constructor(private readonly storage: Storage) {}

  private loadAll(): Record<string, RoutineObject> {
    const data = this.storage.getItem(STORAGE_KEY);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private saveAll(routines: Record<string, RoutineObject>): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(routines));
  }

  async save(routine: Routine): Promise<void> {
    const routines = this.loadAll();
    routines[routine.id] = routine.toObject();
    this.saveAll(routines);
  }

  async findById(id: string): Promise<Routine | null> {
    const routines = this.loadAll();
    const routineData = routines[id];
    if (!routineData) return null;
    return Routine.fromObject(routineData);
  }

  async findAll(): Promise<Routine[]> {
    const routines = this.loadAll();
    return Object.values(routines).map(data => Routine.fromObject(data));
  }

  async findActive(): Promise<Routine[]> {
    const all = await this.findAll();
    return all.filter(routine => routine.isActive);
  }

  async delete(id: string): Promise<void> {
    const routines = this.loadAll();
    delete routines[id];
    this.saveAll(routines);
  }
}
