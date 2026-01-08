import { Sprint, SprintId, ISprintRepository, SprintProps } from '@checkmate/domain';

interface SprintData {
  id: string;
  startDate: string;
  endDate: string;
  capacityOverrides: Record<string, number>;
}

/**
 * In-memory implementation of Sprint repository
 */
export class InMemorySprintRepository implements ISprintRepository {
  private sprints: Map<string, SprintData> = new Map();

  constructor(initialData?: SprintData[]) {
    if (initialData) {
      for (const data of initialData) {
        this.sprints.set(data.id, data);
      }
    }
  }

  async save(sprint: Sprint): Promise<void> {
    this.sprints.set(sprint.id.toString(), sprint.toData());
  }

  async findById(id: SprintId): Promise<Sprint | null> {
    const data = this.sprints.get(id.toString());
    if (!data) return null;
    return this.hydrate(data);
  }

  async findAll(): Promise<Sprint[]> {
    return Array.from(this.sprints.values()).map((d) => this.hydrate(d));
  }

  async findByDate(date: Date): Promise<Sprint | null> {
    const data = Array.from(this.sprints.values()).find((s) => {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      return date >= start && date <= end;
    });
    if (!data) return null;
    return this.hydrate(data);
  }

  async findCurrent(today: Date = new Date()): Promise<Sprint | null> {
    return this.findByDate(today);
  }

  async delete(id: SprintId): Promise<void> {
    this.sprints.delete(id.toString());
  }

  getAllData(): SprintData[] {
    return Array.from(this.sprints.values());
  }

  loadData(data: SprintData[]): void {
    this.sprints.clear();
    for (const d of data) {
      this.sprints.set(d.id, d);
    }
  }

  private hydrate(data: SprintData): Sprint {
    const overrides = new Map<string, number>();
    for (const [key, value] of Object.entries(data.capacityOverrides || {})) {
      overrides.set(key, value);
    }

    const props: SprintProps = {
      id: SprintId.fromString(data.id),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      capacityOverrides: overrides,
    };

    return Sprint.fromProps(props);
  }
}
