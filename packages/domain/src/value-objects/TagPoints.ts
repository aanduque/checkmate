import { TagId } from './TagId';
import { Points } from './Points';

/**
 * TagPoints value object - represents effort allocation across tags
 */
export class TagPoints {
  private readonly _brand: 'TagPoints' = 'TagPoints';
  private readonly points: Map<string, Points>;

  private constructor(points: Map<string, Points>) {
    this.points = points;
  }

  static create(tagPoints: Record<string, number>): TagPoints {
    const entries = Object.entries(tagPoints);
    if (entries.length === 0) {
      throw new Error('Task must have at least one tag with points');
    }

    const pointsMap = new Map<string, Points>();
    for (const [tagId, value] of entries) {
      pointsMap.set(tagId, Points.create(value));
    }

    return new TagPoints(pointsMap);
  }

  static empty(): TagPoints {
    return new TagPoints(new Map());
  }

  getPointsForTag(tagId: TagId): Points | undefined {
    return this.points.get(tagId.toString());
  }

  getTotalPoints(): number {
    let total = 0;
    for (const points of this.points.values()) {
      total += points.toNumber();
    }
    return total;
  }

  getTagIds(): TagId[] {
    return Array.from(this.points.keys()).map((id) => TagId.fromString(id));
  }

  hasTag(tagId: TagId): boolean {
    return this.points.has(tagId.toString());
  }

  toRecord(): Record<string, number> {
    const record: Record<string, number> = {};
    for (const [tagId, points] of this.points.entries()) {
      record[tagId] = points.toNumber();
    }
    return record;
  }

  isEmpty(): boolean {
    return this.points.size === 0;
  }

  withTag(tagId: TagId, points: Points): TagPoints {
    const newPoints = new Map(this.points);
    newPoints.set(tagId.toString(), points);
    return new TagPoints(newPoints);
  }

  withoutTag(tagId: TagId): TagPoints {
    const newPoints = new Map(this.points);
    newPoints.delete(tagId.toString());
    return new TagPoints(newPoints);
  }
}
