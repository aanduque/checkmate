import { describe, it, expect } from 'vitest';
import { Routine } from '../../src/entities/Routine';

describe('Routine', () => {
  describe('create', () => {
    it('should create a routine with required fields', () => {
      const routine = Routine.create({
        name: 'Work Hours',
        icon: '💼',
        color: '#3b82f6',
        priority: 8,
        taskFilterExpression: 'hasTag("Work")',
        activationExpression: 'isWeekday and hour >= 9 and hour < 18'
      });

      expect(routine.id).toBeDefined();
      expect(routine.name).toBe('Work Hours');
      expect(routine.icon).toBe('💼');
      expect(routine.color).toBe('#3b82f6');
      expect(routine.priority).toBe(8);
      expect(routine.taskFilterExpression).toBe('hasTag("Work")');
      expect(routine.activationExpression).toBe('isWeekday and hour >= 9 and hour < 18');
    });

    it('should throw for empty name', () => {
      expect(() => Routine.create({
        name: '',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      })).toThrow('Routine name cannot be empty');
    });

    it('should throw for priority less than 1', () => {
      expect(() => Routine.create({
        name: 'Test',
        icon: '💼',
        color: '#3b82f6',
        priority: 0,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      })).toThrow('Priority must be between 1 and 10');
    });

    it('should throw for priority greater than 10', () => {
      expect(() => Routine.create({
        name: 'Test',
        icon: '💼',
        color: '#3b82f6',
        priority: 11,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      })).toThrow('Priority must be between 1 and 10');
    });

    it('should trim name', () => {
      const routine = Routine.create({
        name: '  Work Hours  ',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      expect(routine.name).toBe('Work Hours');
    });
  });

  describe('updateName', () => {
    it('should update the name', () => {
      const routine = Routine.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      const updated = routine.updateName('Office Hours');
      expect(updated.name).toBe('Office Hours');
    });

    it('should throw for empty name', () => {
      const routine = Routine.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      expect(() => routine.updateName('')).toThrow('Routine name cannot be empty');
    });

    it('should not mutate original', () => {
      const routine = Routine.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      routine.updateName('Office');
      expect(routine.name).toBe('Work');
    });
  });

  describe('updateIcon', () => {
    it('should update the icon', () => {
      const routine = Routine.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      const updated = routine.updateIcon('🏢');
      expect(updated.icon).toBe('🏢');
    });
  });

  describe('updateColor', () => {
    it('should update the color', () => {
      const routine = Routine.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      const updated = routine.updateColor('#ff0000');
      expect(updated.color).toBe('#ff0000');
    });
  });

  describe('updatePriority', () => {
    it('should update the priority', () => {
      const routine = Routine.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      const updated = routine.updatePriority(8);
      expect(updated.priority).toBe(8);
    });

    it('should throw for invalid priority', () => {
      const routine = Routine.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      expect(() => routine.updatePriority(0)).toThrow('Priority must be between 1 and 10');
      expect(() => routine.updatePriority(11)).toThrow('Priority must be between 1 and 10');
    });
  });

  describe('updateTaskFilterExpression', () => {
    it('should update the task filter expression', () => {
      const routine = Routine.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      const updated = routine.updateTaskFilterExpression('hasTag("Personal")');
      expect(updated.taskFilterExpression).toBe('hasTag("Personal")');
    });

    it('should allow empty expression (defaults to show all)', () => {
      const routine = Routine.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'hasTag("Work")',
        activationExpression: 'true'
      });
      const updated = routine.updateTaskFilterExpression('');
      expect(updated.taskFilterExpression).toBe('');
    });
  });

  describe('updateActivationExpression', () => {
    it('should update the activation expression', () => {
      const routine = Routine.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      const updated = routine.updateActivationExpression('isWeekend');
      expect(updated.activationExpression).toBe('isWeekend');
    });
  });

  describe('comparePriority', () => {
    it('should return positive if this routine has higher priority', () => {
      const high = Routine.create({
        name: 'High',
        icon: '💼',
        color: '#000',
        priority: 8,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      const low = Routine.create({
        name: 'Low',
        icon: '💼',
        color: '#000',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });

      expect(high.comparePriority(low)).toBeGreaterThan(0);
    });

    it('should return negative if this routine has lower priority', () => {
      const high = Routine.create({
        name: 'High',
        icon: '💼',
        color: '#000',
        priority: 8,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      const low = Routine.create({
        name: 'Low',
        icon: '💼',
        color: '#000',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });

      expect(low.comparePriority(high)).toBeLessThan(0);
    });

    it('should return 0 if priorities are equal', () => {
      const routine1 = Routine.create({
        name: 'One',
        icon: '💼',
        color: '#000',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });
      const routine2 = Routine.create({
        name: 'Two',
        icon: '💼',
        color: '#000',
        priority: 5,
        taskFilterExpression: 'true',
        activationExpression: 'true'
      });

      expect(routine1.comparePriority(routine2)).toBe(0);
    });
  });

  describe('fromObject / toObject', () => {
    it('should serialize and deserialize a routine', () => {
      const routine = Routine.create({
        name: 'Work Hours',
        icon: '💼',
        color: '#3b82f6',
        priority: 8,
        taskFilterExpression: 'hasTag("Work")',
        activationExpression: 'isWeekday'
      });

      const obj = routine.toObject();
      const restored = Routine.fromObject(obj);

      expect(restored.id).toBe(routine.id);
      expect(restored.name).toBe(routine.name);
      expect(restored.icon).toBe(routine.icon);
      expect(restored.color).toBe(routine.color);
      expect(restored.priority).toBe(routine.priority);
      expect(restored.taskFilterExpression).toBe(routine.taskFilterExpression);
      expect(restored.activationExpression).toBe(routine.activationExpression);
    });
  });
});
