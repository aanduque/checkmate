/**
 * TaskLocation - Where a task lives (backlog or sprint)
 * Value Object: Immutable, discriminated union
 *
 * Per DEC-019: Tasks can move freely between backlog and any sprint
 */

export type TaskLocationType = 'backlog' | 'sprint';

export interface TaskLocationObject {
  type: TaskLocationType;
  sprintId?: string;
}

export class TaskLocation {
  private constructor(
    private readonly _type: TaskLocationType,
    private readonly _sprintId?: string
  ) {}

  get type(): TaskLocationType {
    return this._type;
  }

  get sprintId(): string | undefined {
    return this._sprintId;
  }

  /**
   * Create a backlog location
   */
  static backlog(): TaskLocation {
    return new TaskLocation('backlog');
  }

  /**
   * Create a sprint location
   */
  static sprint(sprintId: string): TaskLocation {
    if (!sprintId || !sprintId.trim()) {
      throw new Error('Sprint ID cannot be empty');
    }
    return new TaskLocation('sprint', sprintId.trim());
  }

  /**
   * Create from a plain object (for deserialization)
   */
  static fromObject(obj: TaskLocationObject): TaskLocation {
    if (obj.type === 'backlog') {
      return TaskLocation.backlog();
    }
    if (obj.type === 'sprint') {
      if (!obj.sprintId) {
        throw new Error('Sprint ID is required for sprint location');
      }
      return TaskLocation.sprint(obj.sprintId);
    }
    throw new Error(`Invalid location type: ${obj.type}`);
  }

  /**
   * Check if location is backlog
   */
  isBacklog(): boolean {
    return this._type === 'backlog';
  }

  /**
   * Check if location is in a sprint
   */
  isSprint(): boolean {
    return this._type === 'sprint';
  }

  /**
   * Check equality with another TaskLocation
   */
  equals(other: TaskLocation): boolean {
    if (this._type !== other._type) {
      return false;
    }
    if (this._type === 'sprint') {
      return this._sprintId === other._sprintId;
    }
    return true;
  }

  /**
   * Convert to a plain object (for serialization)
   */
  toObject(): TaskLocationObject {
    if (this._type === 'backlog') {
      return { type: 'backlog' };
    }
    return { type: 'sprint', sprintId: this._sprintId };
  }
}
