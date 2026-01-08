import { describe, it, expect } from 'vitest';
import { SprintHealthService } from '../../src/services/SprintHealthService';
import { Sprint } from '../../src/entities/Sprint';
import { Task } from '../../src/entities/Task';
import { Tag } from '../../src/entities/Tag';

describe('SprintHealthService', () => {
  const service = new SprintHealthService();

  function createTag(name: string, capacity: number): Tag {
    return Tag.create({
      name,
      icon: '📌',
      color: '#000',
      defaultCapacity: capacity,
    });
  }

  function createTaskInSprint(sprint: Sprint, tagId: string, points: number): Task {
    const task = Task.create({
      title: 'Test task',
      tagPoints: { [tagId]: points },
    });
    task.moveToSprint(sprint.id);
    return task;
  }

  describe('calculate', () => {
    it('should return on_track for empty sprint', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));
      const tags = [createTag('Work', 25)];

      const report = service.calculate(sprint, [], tags);

      expect(report.overallHealth).toBe('on_track');
    });

    it('should return on_track for sustainable burn rate', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));
      const tag = createTag('Work', 21); // 3 pts/day sustainable
      const task = createTaskInSprint(sprint, tag.id.toString(), 5);

      // At day 1 with 5 points, burn rate is 5/7 ≈ 0.7 < 3
      const report = service.calculate(sprint, [task], [tag], new Date('2025-01-05'));

      expect(report.tagHealths[0].health).toBe('on_track');
      expect(report.overallHealth).toBe('on_track');
    });

    it('should return at_risk when burn rate exceeds sustainable by 20%', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));
      const tag = createTag('Work', 7); // 1 pt/day sustainable

      // Create task with 5 points, with 3 days left need 1.67/day
      // sustainable is 1/day, so 1.67/1 = 1.67 > 1.2, should be at_risk
      const task = createTaskInSprint(sprint, tag.id.toString(), 5);

      const report = service.calculate(sprint, [task], [tag], new Date('2025-01-08'));

      expect(report.tagHealths[0].health).toBe('at_risk');
    });

    it('should return off_track when burn rate exceeds sustainable by 50%', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));
      const tag = createTag('Work', 7); // 1 pt/day sustainable

      // Create task with 8 points, with 2 days left need 4/day
      // sustainable is 1/day, so 4/1 = 4 > 1.5, should be off_track
      const task = createTaskInSprint(sprint, tag.id.toString(), 8);

      const report = service.calculate(sprint, [task], [tag], new Date('2025-01-10'));

      expect(report.tagHealths[0].health).toBe('off_track');
      expect(report.overallHealth).toBe('off_track');
    });

    it('should use worst health across all tags', () => {
      const sprint = Sprint.create(new Date('2025-01-05'));
      const goodTag = createTag('Easy', 21);
      const badTag = createTag('Hard', 7);

      const easyTask = createTaskInSprint(sprint, goodTag.id.toString(), 3);
      const hardTask = createTaskInSprint(sprint, badTag.id.toString(), 8);

      const report = service.calculate(
        sprint,
        [easyTask, hardTask],
        [goodTag, badTag],
        new Date('2025-01-10')
      );

      // Hard tag should be off_track, making overall off_track
      expect(report.overallHealth).toBe('off_track');
    });
  });
});
