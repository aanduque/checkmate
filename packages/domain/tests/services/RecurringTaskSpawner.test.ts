/**
 * RecurringTaskSpawner Tests (TDD - Red Phase First)
 *
 * Per DESIGN.md and DEC-004:
 * - Recurring tasks are templates that spawn instances
 * - Templates have a recurrence (RRule) field
 * - Instances have parentId pointing to template
 * - Spawning happens on-demand based on date range
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RecurringTaskSpawner } from '../../src/services/RecurringTaskSpawner';
import { Task } from '../../src/entities/Task';
import type { IRecurrenceCalculator, ParsedRRule, RRuleValidationResult } from '../../src/ports/IRecurrenceCalculator';

// Mock implementation of IRecurrenceCalculator
class MockRecurrenceCalculator implements IRecurrenceCalculator {
  private occurrences: Map<string, Date[]> = new Map();

  setOccurrences(rrule: string, dates: Date[]): void {
    this.occurrences.set(rrule, dates);
  }

  parse(rrule: string): ParsedRRule {
    return {
      rruleString: rrule,
      isValid: this.occurrences.has(rrule),
      description: 'mock'
    };
  }

  validate(rrule: string): RRuleValidationResult {
    return { valid: this.occurrences.has(rrule) };
  }

  getNextOccurrence(rrule: string, after: Date): Date | null {
    const dates = this.occurrences.get(rrule) ?? [];
    return dates.find(d => d.getTime() > after.getTime()) ?? null;
  }

  getOccurrences(rrule: string, start: Date, end: Date): Date[] {
    const dates = this.occurrences.get(rrule) ?? [];
    return dates.filter(d => d >= start && d <= end);
  }

  getDescription(rrule: string): string {
    return 'mock description';
  }
}

describe('RecurringTaskSpawner', () => {
  let spawner: RecurringTaskSpawner;
  let mockCalculator: MockRecurrenceCalculator;

  beforeEach(() => {
    mockCalculator = new MockRecurrenceCalculator();
    spawner = new RecurringTaskSpawner(mockCalculator);
  });

  const createTemplate = (overrides: Partial<{
    title: string;
    description: string;
    recurrence: string;
    tagPoints: Record<string, number>;
  }> = {}): Task => {
    return Task.create({
      title: overrides.title ?? 'Daily Task',
      description: overrides.description ?? 'Description',
      tagPoints: overrides.tagPoints ?? { 'tag-1': 3 },
      recurrence: overrides.recurrence ?? 'FREQ=DAILY'
    });
  };

  describe('with no templates', () => {
    it('should return empty array when no templates provided', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-07');

      const spawned = spawner.spawnDueInstances([], [], { start, end });

      expect(spawned).toEqual([]);
    });
  });

  describe('with templates but no occurrences in range', () => {
    it('should return empty array when no occurrences', () => {
      const template = createTemplate({ recurrence: 'FREQ=DAILY' });
      // No occurrences set for this rrule

      const start = new Date('2025-01-01');
      const end = new Date('2025-01-07');

      const spawned = spawner.spawnDueInstances([template], [], { start, end });

      expect(spawned).toEqual([]);
    });
  });

  describe('spawning instances', () => {
    it('should spawn instance for each occurrence date', () => {
      const template = createTemplate({ recurrence: 'FREQ=DAILY' });
      mockCalculator.setOccurrences('FREQ=DAILY', [
        new Date('2025-01-01'),
        new Date('2025-01-02'),
        new Date('2025-01-03')
      ]);

      const start = new Date('2025-01-01');
      const end = new Date('2025-01-03');

      const spawned = spawner.spawnDueInstances([template], [], { start, end });

      expect(spawned.length).toBe(3);
    });

    it('should copy title from template', () => {
      const template = createTemplate({
        title: 'Morning Standup',
        recurrence: 'FREQ=DAILY'
      });
      mockCalculator.setOccurrences('FREQ=DAILY', [new Date('2025-01-01')]);

      const spawned = spawner.spawnDueInstances([template], [], {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-01')
      });

      expect(spawned[0].title).toBe('Morning Standup');
    });

    it('should copy description from template', () => {
      const template = createTemplate({
        description: 'Check in with team',
        recurrence: 'FREQ=DAILY'
      });
      mockCalculator.setOccurrences('FREQ=DAILY', [new Date('2025-01-01')]);

      const spawned = spawner.spawnDueInstances([template], [], {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-01')
      });

      expect(spawned[0].description).toBe('Check in with team');
    });

    it('should copy tagPoints from template', () => {
      const template = createTemplate({
        tagPoints: { 'work': 3, 'coding': 5 },
        recurrence: 'FREQ=DAILY'
      });
      mockCalculator.setOccurrences('FREQ=DAILY', [new Date('2025-01-01')]);

      const spawned = spawner.spawnDueInstances([template], [], {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-01')
      });

      expect(spawned[0].tagPoints.getValue('work')).toBe(3);
      expect(spawned[0].tagPoints.getValue('coding')).toBe(5);
    });

    it('should set parentId to template id', () => {
      const template = createTemplate({ recurrence: 'FREQ=DAILY' });
      mockCalculator.setOccurrences('FREQ=DAILY', [new Date('2025-01-01')]);

      const spawned = spawner.spawnDueInstances([template], [], {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-01')
      });

      expect(spawned[0].parentId).toBe(template.id);
    });

    it('should create instances in backlog', () => {
      const template = createTemplate({ recurrence: 'FREQ=DAILY' });
      mockCalculator.setOccurrences('FREQ=DAILY', [new Date('2025-01-01')]);

      const spawned = spawner.spawnDueInstances([template], [], {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-01')
      });

      expect(spawned[0].location.isBacklog()).toBe(true);
    });

    it('should create instances with active status', () => {
      const template = createTemplate({ recurrence: 'FREQ=DAILY' });
      mockCalculator.setOccurrences('FREQ=DAILY', [new Date('2025-01-01')]);

      const spawned = spawner.spawnDueInstances([template], [], {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-01')
      });

      expect(spawned[0].status.isActive()).toBe(true);
    });

    it('should NOT copy recurrence to instance', () => {
      const template = createTemplate({ recurrence: 'FREQ=DAILY' });
      mockCalculator.setOccurrences('FREQ=DAILY', [new Date('2025-01-01')]);

      const spawned = spawner.spawnDueInstances([template], [], {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-01')
      });

      expect(spawned[0].recurrence).toBeNull();
    });
  });

  describe('avoiding duplicate instances', () => {
    it('should not spawn if instance already exists for occurrence', () => {
      const template = createTemplate({ recurrence: 'FREQ=DAILY' });
      mockCalculator.setOccurrences('FREQ=DAILY', [
        new Date('2025-01-01'),
        new Date('2025-01-02')
      ]);

      // Create existing instance for Jan 1
      const existingInstance = template.spawnInstance();

      const spawned = spawner.spawnDueInstances([template], [existingInstance], {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-02')
      });

      // Should only spawn for Jan 2 since Jan 1 already has an instance
      expect(spawned.length).toBe(1);
    });

    it('should match by parentId when checking for existing instances', () => {
      const template1 = createTemplate({ title: 'Task 1', recurrence: 'FREQ=DAILY' });
      const template2 = createTemplate({ title: 'Task 2', recurrence: 'FREQ=WEEKLY' });

      mockCalculator.setOccurrences('FREQ=DAILY', [new Date('2025-01-01')]);
      mockCalculator.setOccurrences('FREQ=WEEKLY', [new Date('2025-01-01')]);

      // Existing instance is for template1
      const existingInstance = template1.spawnInstance();

      const spawned = spawner.spawnDueInstances(
        [template1, template2],
        [existingInstance],
        { start: new Date('2025-01-01'), end: new Date('2025-01-01') }
      );

      // Should spawn for template2 since the existing instance is for template1
      expect(spawned.length).toBe(1);
      expect(spawned[0].parentId).toBe(template2.id);
    });
  });

  describe('multiple templates', () => {
    it('should spawn instances for all templates', () => {
      const template1 = createTemplate({ title: 'Daily', recurrence: 'FREQ=DAILY' });
      const template2 = createTemplate({ title: 'Weekly', recurrence: 'FREQ=WEEKLY' });

      mockCalculator.setOccurrences('FREQ=DAILY', [
        new Date('2025-01-01'),
        new Date('2025-01-02')
      ]);
      mockCalculator.setOccurrences('FREQ=WEEKLY', [
        new Date('2025-01-05')
      ]);

      const spawned = spawner.spawnDueInstances(
        [template1, template2],
        [],
        { start: new Date('2025-01-01'), end: new Date('2025-01-07') }
      );

      // 2 from daily + 1 from weekly = 3
      expect(spawned.length).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should skip templates without recurrence', () => {
      const regularTask = Task.create({
        title: 'Regular Task',
        tagPoints: { 'tag': 1 }
        // No recurrence
      });

      const spawned = spawner.spawnDueInstances([regularTask], [], {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-07')
      });

      expect(spawned).toEqual([]);
    });

    it('should handle empty date range', () => {
      const template = createTemplate({ recurrence: 'FREQ=DAILY' });
      mockCalculator.setOccurrences('FREQ=DAILY', [
        new Date('2025-01-01')
      ]);

      // Range where start > end
      const spawned = spawner.spawnDueInstances([template], [], {
        start: new Date('2025-01-07'),
        end: new Date('2025-01-01')
      });

      expect(spawned).toEqual([]);
    });
  });
});
