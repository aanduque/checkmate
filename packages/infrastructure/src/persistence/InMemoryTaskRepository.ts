import {
  Task,
  TaskId,
  SprintId,
  ITaskRepository,
  TaskProps,
  TagPoints,
  Location,
  SkipState,
  Recurrence,
  Comment,
  CommentId,
  Session,
  SessionId,
  FocusLevel,
} from '@checkmate/domain';

interface TaskData {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'canceled';
  tagPoints: Record<string, number>;
  location: { type: string; sprintId?: string };
  createdAt: string;
  completedAt: string | null;
  canceledAt: string | null;
  skipState: any | null;
  recurrence: string | null;
  parentId: string | null;
  comments: any[];
  sessions: any[];
  sprintHistory: string[];
  order: number;
}

/**
 * In-memory implementation of Task repository
 * Stores data in a Map (can be backed by localStorage)
 */
export class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Map<string, TaskData> = new Map();

  constructor(initialData?: TaskData[]) {
    if (initialData) {
      for (const data of initialData) {
        this.tasks.set(data.id, data);
      }
    }
  }

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id.toString(), task.toData() as TaskData);
  }

  async findById(id: TaskId): Promise<Task | null> {
    const data = this.tasks.get(id.toString());
    if (!data) return null;
    return this.hydrate(data);
  }

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values()).map((d) => this.hydrate(d));
  }

  async findBySprintId(sprintId: SprintId): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(
        (d) =>
          d.location.type === 'sprint' &&
          d.location.sprintId === sprintId.toString()
      )
      .map((d) => this.hydrate(d));
  }

  async findInBacklog(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((d) => d.location.type === 'backlog')
      .map((d) => this.hydrate(d));
  }

  async findTemplates(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((d) => d.recurrence !== null)
      .map((d) => this.hydrate(d));
  }

  async findByParentId(parentId: TaskId): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((d) => d.parentId === parentId.toString())
      .map((d) => this.hydrate(d));
  }

  async findActive(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((d) => d.status === 'active')
      .map((d) => this.hydrate(d));
  }

  async findCompleted(): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter((d) => d.status === 'completed' || d.status === 'canceled')
      .map((d) => this.hydrate(d));
  }

  async delete(id: TaskId): Promise<void> {
    this.tasks.delete(id.toString());
  }

  getAllData(): TaskData[] {
    return Array.from(this.tasks.values());
  }

  loadData(data: TaskData[]): void {
    this.tasks.clear();
    for (const d of data) {
      this.tasks.set(d.id, d);
    }
  }

  private hydrate(data: TaskData): Task {
    const comments = (data.comments || []).map((c: any) =>
      Comment.fromProps({
        id: CommentId.fromString(c.id),
        content: c.content,
        createdAt: new Date(c.createdAt),
        updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
        skipJustification: c.skipJustification,
      })
    );

    const sessions = (data.sessions || []).map((s: any) =>
      Session.fromProps({
        id: SessionId.fromString(s.id),
        status: s.status,
        startedAt: new Date(s.startedAt),
        endedAt: s.endedAt ? new Date(s.endedAt) : undefined,
        focusLevel: s.focusLevel ? FocusLevel.create(s.focusLevel) : undefined,
        comments: (s.comments || []).map((c: any) =>
          Comment.fromProps({
            id: CommentId.fromString(c.id),
            content: c.content,
            createdAt: new Date(c.createdAt),
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : undefined,
            skipJustification: false,
          })
        ),
      })
    );

    const props: TaskProps = {
      id: TaskId.fromString(data.id),
      title: data.title,
      description: data.description,
      status: data.status,
      tagPoints: TagPoints.create(data.tagPoints),
      location: Location.fromData(data.location as any),
      createdAt: new Date(data.createdAt),
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      canceledAt: data.canceledAt ? new Date(data.canceledAt) : undefined,
      skipState: data.skipState ? SkipState.fromData(data.skipState) : undefined,
      recurrence: data.recurrence
        ? Recurrence.fromString(data.recurrence)
        : undefined,
      parentId: data.parentId ? TaskId.fromString(data.parentId) : undefined,
      comments,
      sessions,
      sprintHistory: data.sprintHistory || [],
      order: data.order || 0,
    };

    return Task.fromProps(props);
  }
}
