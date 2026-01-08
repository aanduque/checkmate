import { SprintId } from './SprintId';

/**
 * TaskLocation value object - represents where a task lives
 */
export type LocationType = 'backlog' | 'sprint';

export class Location {
  private readonly _brand: 'Location' = 'Location';

  private constructor(
    private readonly type: LocationType,
    private readonly sprintId?: SprintId
  ) {}

  static backlog(): Location {
    return new Location('backlog');
  }

  static sprint(sprintId: SprintId): Location {
    return new Location('sprint', sprintId);
  }

  static fromData(data: { type: LocationType; sprintId?: string }): Location {
    if (data.type === 'sprint' && data.sprintId) {
      return Location.sprint(SprintId.fromString(data.sprintId));
    }
    return Location.backlog();
  }

  isBacklog(): boolean {
    return this.type === 'backlog';
  }

  isSprint(): boolean {
    return this.type === 'sprint';
  }

  getSprintId(): SprintId | undefined {
    return this.sprintId;
  }

  getType(): LocationType {
    return this.type;
  }

  toData(): { type: LocationType; sprintId?: string } {
    if (this.type === 'sprint' && this.sprintId) {
      return { type: 'sprint', sprintId: this.sprintId.toString() };
    }
    return { type: 'backlog' };
  }

  equals(other: Location): boolean {
    if (this.type !== other.type) return false;
    if (this.type === 'backlog') return true;
    return this.sprintId?.equals(other.sprintId!) ?? false;
  }
}
