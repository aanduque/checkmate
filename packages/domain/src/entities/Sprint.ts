/**
 * Sprint - Weekly planning period
 * Entity: Has identity, time-bounded
 *
 * Per DEC-003: Sprints are always exactly 7 days (Sunday to Saturday)
 */

export interface SprintObject {
  id: string;
  startDate: string;
  endDate: string;
  capacityOverrides: Record<string, number>;
}

export class Sprint {
  private constructor(
    private readonly _id: string,
    private readonly _startDate: Date,
    private readonly _endDate: Date,
    private readonly _capacityOverrides: Map<string, number>
  ) {}

  get id(): string { return this._id; }
  get startDate(): Date { return this._startDate; }
  get endDate(): Date { return this._endDate; }

  /**
   * Create a new sprint starting on the given Sunday
   */
  static create(startDate: Date): Sprint {
    // Normalize to midnight
    const normalized = new Date(startDate);
    normalized.setHours(0, 0, 0, 0);

    // Validate it's a Sunday (day 0)
    if (normalized.getDay() !== 0) {
      throw new Error('Sprint must start on a Sunday');
    }

    // End date is 6 days after start (7 day sprint, inclusive)
    const endDate = new Date(normalized);
    endDate.setDate(endDate.getDate() + 6);

    return new Sprint(
      Sprint.generateId(),
      normalized,
      endDate,
      new Map()
    );
  }

  /**
   * Create a sprint for the current week
   */
  static createForCurrentWeek(): Sprint {
    const now = new Date();
    const day = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - day);
    sunday.setHours(0, 0, 0, 0);
    return Sprint.create(sunday);
  }

  /**
   * Get capacity for a tag (returns override or default)
   */
  getCapacity(tagId: string, defaultCapacity: number): number {
    return this._capacityOverrides.get(tagId) ?? defaultCapacity;
  }

  /**
   * Set a capacity override for a tag
   */
  setCapacityOverride(tagId: string, capacity: number): Sprint {
    if (capacity <= 0) {
      throw new Error('Capacity must be greater than 0');
    }

    const newOverrides = new Map(this._capacityOverrides);
    newOverrides.set(tagId, capacity);

    return new Sprint(
      this._id,
      this._startDate,
      this._endDate,
      newOverrides
    );
  }

  /**
   * Clear a capacity override for a tag
   */
  clearCapacityOverride(tagId: string): Sprint {
    const newOverrides = new Map(this._capacityOverrides);
    newOverrides.delete(tagId);

    return new Sprint(
      this._id,
      this._startDate,
      this._endDate,
      newOverrides
    );
  }

  /**
   * Get days remaining in the sprint (including current day)
   */
  getDaysRemaining(currentDate: Date = new Date()): number {
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);

    const end = new Date(this._endDate);
    end.setHours(23, 59, 59, 999);

    if (current > end) {
      return 0;
    }

    const diff = end.getTime() - current.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if the sprint is currently active
   */
  isActive(currentDate: Date = new Date()): boolean {
    const current = new Date(currentDate);
    current.setHours(0, 0, 0, 0);

    const start = new Date(this._startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(this._endDate);
    end.setHours(23, 59, 59, 999);

    return current >= start && current <= end;
  }

  /**
   * Get a human-readable label for the sprint
   */
  getLabel(index: number): string {
    switch (index) {
      case 0: return 'This Week';
      case 1: return 'Next Week';
      default: return `Sprint +${index}`;
    }
  }

  /**
   * Recreate from a plain object
   */
  static fromObject(obj: SprintObject): Sprint {
    const overrides = new Map(Object.entries(obj.capacityOverrides));

    return new Sprint(
      obj.id,
      new Date(obj.startDate),
      new Date(obj.endDate),
      overrides
    );
  }

  /**
   * Serialize to a plain object
   */
  toObject(): SprintObject {
    const overrides: Record<string, number> = {};
    for (const [key, value] of this._capacityOverrides) {
      overrides[key] = value;
    }

    return {
      id: this._id,
      startDate: this._startDate.toISOString(),
      endDate: this._endDate.toISOString(),
      capacityOverrides: overrides
    };
  }

  private static generateId(): string {
    return `sprint_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}_${Date.now()}`;
  }
}
