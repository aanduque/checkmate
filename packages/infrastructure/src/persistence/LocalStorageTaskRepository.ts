/**
 * LocalStorageTaskRepository - Persists tasks to localStorage
 */

import { ITaskRepository, Task, TaskLocation, TaskObject } from '@checkmate/domain';

const STORAGE_KEY = 'checkmate_tasks';

export class LocalStorageTaskRepository implements ITaskRepository {
  constructor(private readonly storage: Storage) {}

  private loadAll(): Record<string, TaskObject> {
    const data = this.storage.getItem(STORAGE_KEY);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private saveAll(tasks: Record<string, TaskObject>): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  async save(task: Task): Promise<void> {
    const tasks = this.loadAll();
    tasks[task.id] = task.toObject();
    this.saveAll(tasks);
  }

  async findById(id: string): Promise<Task | null> {
    const tasks = this.loadAll();
    const taskData = tasks[id];
    if (!taskData) return null;
    return Task.fromObject(taskData);
  }

  async findAll(): Promise<Task[]> {
    const tasks = this.loadAll();
    return Object.values(tasks).map(data => Task.fromObject(data));
  }

  async findByLocation(location: TaskLocation): Promise<Task[]> {
    const all = await this.findAll();
    return all.filter(task => {
      if (location.isBacklog()) {
        return task.location.isBacklog();
      }
      if (location.isSprint()) {
        return task.location.sprintId === location.sprintId;
      }
      return false;
    });
  }

  async findTemplates(): Promise<Task[]> {
    const all = await this.findAll();
    return all.filter(task => task.isRecurringTemplate());
  }

  async findActive(): Promise<Task[]> {
    const all = await this.findAll();
    return all.filter(task => task.status.isActive());
  }

  async findCompleted(): Promise<Task[]> {
    const all = await this.findAll();
    return all.filter(task => task.status.isCompleted());
  }

  async delete(id: string): Promise<void> {
    const tasks = this.loadAll();
    delete tasks[id];
    this.saveAll(tasks);
  }
}
