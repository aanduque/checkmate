import { describe, it, expect, beforeEach } from 'vitest';
import { JsonExporter, ExportData } from '../../src/export/JsonExporter';
import { JsonImporter } from '../../src/export/JsonImporter';
import { InMemoryTaskRepository } from '../../src/persistence/InMemoryTaskRepository';
import { InMemoryTagRepository } from '../../src/persistence/InMemoryTagRepository';
import { InMemorySprintRepository } from '../../src/persistence/InMemorySprintRepository';
import { InMemoryRoutineRepository } from '../../src/persistence/InMemoryRoutineRepository';
import { Task, Tag, Sprint, Routine } from '@checkmate/domain';

describe('JsonExporter', () => {
  let taskRepository: InMemoryTaskRepository;
  let tagRepository: InMemoryTagRepository;
  let sprintRepository: InMemorySprintRepository;
  let routineRepository: InMemoryRoutineRepository;
  let exporter: JsonExporter;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    tagRepository = new InMemoryTagRepository();
    sprintRepository = new InMemorySprintRepository();
    routineRepository = new InMemoryRoutineRepository();
    exporter = new JsonExporter(
      taskRepository,
      tagRepository,
      sprintRepository,
      routineRepository
    );
  });

  it('should export empty data', async () => {
    const data = await exporter.export();

    expect(data.version).toBe('1.0');
    expect(data.exportedAt).toBeDefined();
    expect(data.tasks).toEqual([]);
    expect(data.tags).toEqual([]);
    expect(data.sprints).toEqual([]);
    expect(data.routines).toEqual([]);
  });

  it('should export tasks', async () => {
    const task = Task.create({
      title: 'Test task',
      tagPoints: { 'tag-1': 3 },
    });
    await taskRepository.save(task);

    const data = await exporter.export();

    expect(data.tasks.length).toBe(1);
    expect(data.tasks[0].title).toBe('Test task');
  });

  it('should export tags', async () => {
    const tag = Tag.create({
      name: 'Work',
      icon: '💼',
      color: '#0000ff',
      defaultCapacity: 20,
    });
    await tagRepository.save(tag);

    const data = await exporter.export();

    expect(data.tags.length).toBe(1);
    expect(data.tags[0].name).toBe('Work');
  });

  it('should include settings in export', async () => {
    const settings = { defaultSessionDuration: 30, theme: 'dark' };
    const data = await exporter.export(settings);

    expect(data.settings).toEqual(settings);
  });

  it('should convert to JSON string', async () => {
    const data = await exporter.export();
    const json = exporter.exportToString(data);

    expect(typeof json).toBe('string');
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe('JsonImporter', () => {
  let taskRepository: InMemoryTaskRepository;
  let tagRepository: InMemoryTagRepository;
  let sprintRepository: InMemorySprintRepository;
  let routineRepository: InMemoryRoutineRepository;
  let importer: JsonImporter;

  beforeEach(() => {
    taskRepository = new InMemoryTaskRepository();
    tagRepository = new InMemoryTagRepository();
    sprintRepository = new InMemorySprintRepository();
    routineRepository = new InMemoryRoutineRepository();
    importer = new JsonImporter(
      taskRepository,
      tagRepository,
      sprintRepository,
      routineRepository
    );
  });

  it('should validate export data structure', () => {
    const validData: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: [],
      tags: [],
      sprints: [],
      routines: [],
    };

    expect(importer.validate(validData).valid).toBe(true);
  });

  it('should reject invalid data', () => {
    const invalidData = { foo: 'bar' };

    expect(importer.validate(invalidData as any).valid).toBe(false);
  });

  it('should import tasks', async () => {
    const exportData: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: [{
        id: 'task-1',
        title: 'Imported task',
        description: '',
        status: 'active',
        tagPoints: { 'tag-1': 3 },
        location: { type: 'backlog' },
        createdAt: new Date().toISOString(),
        completedAt: null,
        canceledAt: null,
        skipState: null,
        recurrence: null,
        parentId: null,
        comments: [],
        sessions: [],
        sprintHistory: [],
        order: 0,
      }],
      tags: [],
      sprints: [],
      routines: [],
    };

    await importer.import(exportData);
    const tasks = await taskRepository.findAll();

    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe('Imported task');
  });

  it('should parse JSON string', () => {
    const data: ExportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      tasks: [],
      tags: [],
      sprints: [],
      routines: [],
    };
    const json = JSON.stringify(data);

    const parsed = importer.parseFromString(json);

    expect(parsed.version).toBe('1.0');
  });

  it('should throw on invalid JSON', () => {
    expect(() => importer.parseFromString('not valid json')).toThrow();
  });
});
