/**
 * TagPoints - Points allocation per tag for a task
 * Value Object: Immutable, equality by value
 *
 * Per DEC-002: Tasks store points as Map<TagId, Points> where each tag
 * on a task has its own point allocation.
 *
 * Invariant: Must have at least one tag with valid Fibonacci points
 */

import { Points, FIBONACCI_POINTS } from './Points';

export class TagPoints {
  private constructor(private readonly _points: ReadonlyMap<string, number>) {}

  /**
   * Create TagPoints from a record of tagId -> points
   */
  static create(points: Record<string, number>): TagPoints {
    const entries = Object.entries(points);

    if (entries.length === 0) {
      throw new Error('Task must have at least one tag with points');
    }

    // Validate all points are Fibonacci
    for (const [tagId, value] of entries) {
      if (!Points.isValid(value)) {
        throw new Error(
          `Points must be a valid Fibonacci number: ${FIBONACCI_POINTS.join(', ')}. Got: ${value} for tag ${tagId}`
        );
      }
    }

    return new TagPoints(new Map(entries));
  }

  /**
   * Get points for a specific tag, returns 0 if tag not present
   */
  getValue(tagId: string): number {
    return this._points.get(tagId) ?? 0;
  }

  /**
   * Check if a tag has points assigned
   */
  hasTag(tagId: string): boolean {
    return this._points.has(tagId);
  }

  /**
   * Get all tag IDs
   */
  tagIds(): string[] {
    return Array.from(this._points.keys());
  }

  /**
   * Get total points across all tags
   */
  totalPoints(): number {
    let total = 0;
    for (const points of this._points.values()) {
      total += points;
    }
    return total;
  }

  /**
   * Get number of tags
   */
  tagCount(): number {
    return this._points.size;
  }

  /**
   * Convert to a plain record object
   */
  toRecord(): Record<string, number> {
    const record: Record<string, number> = {};
    for (const [key, value] of this._points) {
      record[key] = value;
    }
    return record;
  }

  /**
   * Create a new TagPoints with an additional or updated tag
   */
  withTag(tagId: string, points: number): TagPoints {
    if (!Points.isValid(points)) {
      throw new Error(
        `Points must be a valid Fibonacci number: ${FIBONACCI_POINTS.join(', ')}. Got: ${points}`
      );
    }
    const newRecord = this.toRecord();
    newRecord[tagId] = points;
    return TagPoints.create(newRecord);
  }

  /**
   * Create a new TagPoints without the specified tag
   */
  withoutTag(tagId: string): TagPoints {
    const newRecord = this.toRecord();
    delete newRecord[tagId];

    if (Object.keys(newRecord).length === 0) {
      throw new Error('Task must have at least one tag with points');
    }

    return TagPoints.create(newRecord);
  }

  /**
   * Check equality with another TagPoints
   */
  equals(other: TagPoints): boolean {
    if (this._points.size !== other._points.size) {
      return false;
    }
    for (const [key, value] of this._points) {
      if (other._points.get(key) !== value) {
        return false;
      }
    }
    return true;
  }
}
