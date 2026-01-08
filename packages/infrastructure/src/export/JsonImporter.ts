import { Task, Tag, Sprint, Routine } from '@checkmate/domain';
import { InMemoryTaskRepository } from '../persistence/InMemoryTaskRepository';
import { InMemoryTagRepository } from '../persistence/InMemoryTagRepository';
import { InMemorySprintRepository } from '../persistence/InMemorySprintRepository';
import { InMemoryRoutineRepository } from '../persistence/InMemoryRoutineRepository';
import { ExportData } from './JsonExporter';

export interface ImportResult {
  success: boolean;
  tasksImported: number;
  tagsImported: number;
  sprintsImported: number;
  routinesImported: number;
  errors: string[];
}

/**
 * Service for importing data from JSON
 */
export class JsonImporter {
  constructor(
    private readonly taskRepository: InMemoryTaskRepository,
    private readonly tagRepository: InMemoryTagRepository,
    private readonly sprintRepository: InMemorySprintRepository,
    private readonly routineRepository: InMemoryRoutineRepository
  ) {}

  async import(data: ExportData, merge: boolean = false): Promise<ImportResult> {
    const errors: string[] = [];
    let tasksImported = 0;
    let tagsImported = 0;
    let sprintsImported = 0;
    let routinesImported = 0;

    try {
      // Validate version
      if (!data.version || !data.version.startsWith('1.')) {
        errors.push(`Unsupported export version: ${data.version}`);
        return {
          success: false,
          tasksImported,
          tagsImported,
          sprintsImported,
          routinesImported,
          errors,
        };
      }

      // Clear existing data if not merging
      if (!merge) {
        this.taskRepository.loadData([]);
        this.tagRepository.loadData([]);
        this.sprintRepository.loadData([]);
        this.routineRepository.loadData([]);
      }

      // Import tags first (tasks reference them)
      if (data.tags) {
        this.tagRepository.loadData(data.tags);
        tagsImported = data.tags.length;
      }

      // Import sprints
      if (data.sprints) {
        this.sprintRepository.loadData(data.sprints);
        sprintsImported = data.sprints.length;
      }

      // Import routines
      if (data.routines) {
        this.routineRepository.loadData(data.routines);
        routinesImported = data.routines.length;
      }

      // Import tasks
      if (data.tasks) {
        this.taskRepository.loadData(data.tasks);
        tasksImported = data.tasks.length;
      }

      return {
        success: true,
        tasksImported,
        tagsImported,
        sprintsImported,
        routinesImported,
        errors,
      };
    } catch (e: any) {
      errors.push(e.message);
      return {
        success: false,
        tasksImported,
        tagsImported,
        sprintsImported,
        routinesImported,
        errors,
      };
    }
  }

  parseFromString(jsonString: string): ExportData {
    return JSON.parse(jsonString);
  }

  validate(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Invalid data format');
      return { valid: false, errors };
    }

    if (!data.version) {
      errors.push('Missing version field');
    }

    if (!data.exportedAt) {
      errors.push('Missing exportedAt field');
    }

    if (!Array.isArray(data.tasks)) {
      errors.push('Missing or invalid tasks field');
    }

    if (!Array.isArray(data.tags)) {
      errors.push('Missing or invalid tags field');
    }

    if (!Array.isArray(data.sprints)) {
      errors.push('Missing or invalid sprints field');
    }

    if (!Array.isArray(data.routines)) {
      errors.push('Missing or invalid routines field');
    }

    return { valid: errors.length === 0, errors };
  }
}
