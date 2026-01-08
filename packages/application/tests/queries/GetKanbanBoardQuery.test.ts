import { describe, it, expect, beforeEach } from 'vitest';
import { GetKanbanBoardQuery, GetKanbanBoardHandler } from '../../src/queries/GetKanbanBoardQuery';
import { ITaskRepository, ISprintRepository, ITagRepository, Task, Sprint, Tag, TaskLocation } from '@checkmate/domain';

class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) || null;
  }

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async findByLocation(location: TaskLocation): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => {
      if (location.isBacklog()) return t.location.isBacklog();
      if (location.isSprint()) return t.location.sprintId === location.sprintId;
      return false;
    });
  }

  async findTemplates(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.isRecurringTemplate());
  }

  async findActive(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.status.isActive());
  }

  async findCompleted(): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.status.isCompleted());
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  addTask(task: Task): void {
    this.tasks.set(task.id, task);
  }
}

class InMemorySprintRepository implements ISprintRepository {
  private sprints: Map<string, Sprint> = new Map();

  async save(sprint: Sprint): Promise<void> {
    this.sprints.set(sprint.id, sprint);
  }

  async findById(id: string): Promise<Sprint | null> {
    return this.sprints.get(id) || null;
  }

  async findCurrent(): Promise<Sprint | null> {
    const now = new Date();
    for (const sprint of this.sprints.values()) {
      if (sprint.isActive(now)) {
        return sprint;
      }
    }
    return null;
  }

  async findAll(): Promise<Sprint[]> {
    return Array.from(this.sprints.values());
  }

  async findUpcoming(limit?: number): Promise<Sprint[]> {
    return [];
  }

  async delete(id: string): Promise<void> {
    this.sprints.delete(id);
  }

  addSprint(sprint: Sprint): void {
    this.sprints.set(sprint.id, sprint);
  }
}

class InMemoryTagRepository implements ITagRepository {
  private tags: Map<string, Tag> = new Map();

  async save(tag: Tag): Promise<void> {
    this.tags.set(tag.id, tag);
  }

  async findById(id: string): Promise<Tag | null> {
    return this.tags.get(id) || null;
  }

  async findByName(name: string): Promise<Tag | null> {
    for (const tag of this.tags.values()) {
      if (tag.name.toLowerCase() === name.toLowerCase()) {
        return tag;
      }
    }
    return null;
  }

  async findAll(): Promise<Tag[]> {
    return Array.from(this.tags.values());
  }

  async delete(id: string): Promise<void> {
    this.tags.delete(id);
  }

  addTag(tag: Tag): void {
    this.tags.set(tag.id, tag);
  }
}

describe('GetKanbanBoardQuery', () => {
  let handler: GetKanbanBoardHandler;
  let taskRepository: InMemoryTaskRepository;
  let sprintRepository: InMemorySprintRepository;
  let tagRepository: InMemoryTagRepository;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    sprintRepository = new InMemorySprintRepository();
    tagRepository = new InMemoryTagRepository();
    handler = new GetKanbanBoardHandler(taskRepository, sprintRepository, tagRepository);
  });

  describe('execute', () => {
    it('should return empty board when no tasks exist', async () => {
      const query: GetKanbanBoardQuery = {};
      const result = await handler.execute(query);

      expect(result.backlog).toEqual([]);
      expect(result.sprint).toEqual([]);
      expect(result.completed).toEqual([]);
    });

    it('should return tasks in backlog', async () => {
      const task = Task.create({ title: 'Backlog Task', tagPoints: { 'tag-1': 3 } });
      taskRepository.addTask(task);

      const query: GetKanbanBoardQuery = {};
      const result = await handler.execute(query);

      expect(result.backlog.length).toBe(1);
      expect(result.backlog[0].title).toBe('Backlog Task');
    });

    it('should return tasks in sprint', async () => {
      // Create a sprint that contains today
      const today = new Date();
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - today.getDay());
      sunday.setHours(0, 0, 0, 0);
      const sprint = Sprint.create(sunday);
      sprintRepository.addSprint(sprint);

      const task = Task.create({ title: 'Sprint Task', tagPoints: { 'tag-1': 3 } });
      const taskInSprint = task.moveToSprint(sprint.id);
      taskRepository.addTask(taskInSprint);

      const query: GetKanbanBoardQuery = {};
      const result = await handler.execute(query);

      expect(result.sprint.length).toBe(1);
      expect(result.sprint[0].title).toBe('Sprint Task');
    });

    it('should return completed tasks', async () => {
      const task = Task.create({ title: 'Done Task', tagPoints: { 'tag-1': 3 } });
      const completedTask = task.complete();
      taskRepository.addTask(completedTask);

      const query: GetKanbanBoardQuery = {};
      const result = await handler.execute(query);

      expect(result.completed.length).toBe(1);
      expect(result.completed[0].title).toBe('Done Task');
    });

    it('should separate tasks by location', async () => {
      const today = new Date();
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - today.getDay());
      sunday.setHours(0, 0, 0, 0);
      const sprint = Sprint.create(sunday);
      sprintRepository.addSprint(sprint);

      const backlogTask = Task.create({ title: 'Backlog', tagPoints: { 'tag-1': 1 } });
      const sprintTask = Task.create({ title: 'Sprint', tagPoints: { 'tag-1': 2 } }).moveToSprint(sprint.id);
      const doneTask = Task.create({ title: 'Done', tagPoints: { 'tag-1': 3 } }).complete();

      taskRepository.addTask(backlogTask);
      taskRepository.addTask(sprintTask);
      taskRepository.addTask(doneTask);

      const query: GetKanbanBoardQuery = {};
      const result = await handler.execute(query);

      expect(result.backlog.length).toBe(1);
      expect(result.sprint.length).toBe(1);
      expect(result.completed.length).toBe(1);
    });

    it('should include canceled tasks in completed column', async () => {
      const task = Task.create({ title: 'Canceled Task', tagPoints: { 'tag-1': 3 } });
      const { task: canceledTask } = task.cancel('Not needed anymore');
      taskRepository.addTask(canceledTask);

      const query: GetKanbanBoardQuery = {};
      const result = await handler.execute(query);

      expect(result.completed.length).toBe(1);
      expect(result.completed[0].status).toBe('canceled');
    });

    it('should include tag information with tasks', async () => {
      const tag = Tag.create({ name: 'Work', icon: '💼', color: '#ff0000', defaultCapacity: 21 });
      tagRepository.addTag(tag);

      const task = Task.create({ title: 'Tagged Task', tagPoints: { [tag.id]: 5 } });
      taskRepository.addTask(task);

      const query: GetKanbanBoardQuery = {};
      const result = await handler.execute(query);

      expect(result.backlog[0].tags).toBeDefined();
      expect(result.backlog[0].tags.length).toBe(1);
    });
  });
});
