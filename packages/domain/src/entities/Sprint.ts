import { SprintId } from '../value-objects/SprintId';
import { TagId } from '../value-objects/TagId';

export interface SprintProps {
  id: SprintId;
  startDate: Date;
  endDate: Date;
  capacityOverrides: Map<string, number>;
}

/**
 * Sprint aggregate root - time-bounded container for tasks
 * Always exactly 7 days (Sunday to Saturday)
 */
export class Sprint {
  private constructor(
    private readonly _id: SprintId,
    private readonly _startDate: Date,
    private readonly _endDate: Date,
    private readonly _capacityOverrides: Map<string, number>
  ) {}

  static create(startDate: Date): Sprint {
    // Validate start date is a Sunday
    if (startDate.getDay() !== 0) {
      throw new Error('Sprint must start on a Sunday');
    }

    // Set to start of day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    // End date is Saturday (6 days later)
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return new Sprint(SprintId.create(), start, end, new Map());
  }

  static fromProps(props: SprintProps): Sprint {
    return new Sprint(
      props.id,
      props.startDate,
      props.endDate,
      props.capacityOverrides
    );
  }

  get id(): SprintId {
    return this._id;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get endDate(): Date {
    return this._endDate;
  }

  /**
   * Check if a date falls within this sprint
   */
  containsDate(date: Date): boolean {
    return date >= this._startDate && date <= this._endDate;
  }

  /**
   * Get days remaining in sprint (including today)
   */
  getDaysRemaining(today: Date = new Date()): number {
    // Normalize both dates to start of day for accurate calculation
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    const endStart = new Date(this._endDate);
    endStart.setHours(0, 0, 0, 0);

    const diff = Math.round(
      (endStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, diff + 1); // +1 to include today
  }

  /**
   * Check if sprint is current (contains today)
   */
  isCurrent(today: Date = new Date()): boolean {
    return this.containsDate(today);
  }

  /**
   * Check if sprint is in the past
   */
  isPast(today: Date = new Date()): boolean {
    return this._endDate < today;
  }

  /**
   * Check if sprint is in the future
   */
  isFuture(today: Date = new Date()): boolean {
    return this._startDate > today;
  }

  /**
   * Get capacity for a tag (with override or default)
   */
  getCapacityForTag(tagId: TagId, defaultCapacity: number): number {
    return this._capacityOverrides.get(tagId.toString()) ?? defaultCapacity;
  }

  /**
   * Set capacity override for a tag
   */
  setCapacityOverride(tagId: TagId, capacity: number): void {
    if (capacity <= 0) {
      throw new Error('Capacity must be positive');
    }
    this._capacityOverrides.set(tagId.toString(), capacity);
  }

  /**
   * Clear capacity override for a tag
   */
  clearCapacityOverride(tagId: TagId): void {
    this._capacityOverrides.delete(tagId.toString());
  }

  /**
   * Get all capacity overrides
   */
  getCapacityOverrides(): Map<string, number> {
    return new Map(this._capacityOverrides);
  }

  toData(): {
    id: string;
    startDate: string;
    endDate: string;
    capacityOverrides: Record<string, number>;
  } {
    const overrides: Record<string, number> = {};
    for (const [key, value] of this._capacityOverrides) {
      overrides[key] = value;
    }

    return {
      id: this._id.toString(),
      startDate: this._startDate.toISOString(),
      endDate: this._endDate.toISOString(),
      capacityOverrides: overrides,
    };
  }
}
