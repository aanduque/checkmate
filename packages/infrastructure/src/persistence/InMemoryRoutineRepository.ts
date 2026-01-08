import { Routine, RoutineId, IRoutineRepository, RoutineProps } from '@checkmate/domain';

interface RoutineData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
  taskFilterExpression: string;
  activationExpression: string;
}

/**
 * In-memory implementation of Routine repository
 */
export class InMemoryRoutineRepository implements IRoutineRepository {
  private routines: Map<string, RoutineData> = new Map();

  constructor(initialData?: RoutineData[]) {
    if (initialData) {
      for (const data of initialData) {
        this.routines.set(data.id, data);
      }
    }
  }

  async save(routine: Routine): Promise<void> {
    this.routines.set(routine.id.toString(), routine.toData());
  }

  async findById(id: RoutineId): Promise<Routine | null> {
    const data = this.routines.get(id.toString());
    if (!data) return null;
    return this.hydrate(data);
  }

  async findByName(name: string): Promise<Routine | null> {
    const data = Array.from(this.routines.values()).find(
      (r) => r.name.toLowerCase() === name.toLowerCase()
    );
    if (!data) return null;
    return this.hydrate(data);
  }

  async findAll(): Promise<Routine[]> {
    return Array.from(this.routines.values()).map((d) => this.hydrate(d));
  }

  async delete(id: RoutineId): Promise<void> {
    this.routines.delete(id.toString());
  }

  getAllData(): RoutineData[] {
    return Array.from(this.routines.values());
  }

  loadData(data: RoutineData[]): void {
    this.routines.clear();
    for (const d of data) {
      this.routines.set(d.id, d);
    }
  }

  private hydrate(data: RoutineData): Routine {
    const props: RoutineProps = {
      id: RoutineId.fromString(data.id),
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      priority: data.priority,
      taskFilterExpression: data.taskFilterExpression,
      activationExpression: data.activationExpression,
    };

    return Routine.fromProps(props);
  }
}
