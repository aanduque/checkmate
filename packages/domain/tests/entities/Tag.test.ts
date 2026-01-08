import { describe, it, expect } from 'vitest';
import { Tag } from '../../src/entities/Tag';

describe('Tag', () => {
  describe('create', () => {
    it('should create a tag with required fields', () => {
      const tag = Tag.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      });

      expect(tag.id).toBeDefined();
      expect(tag.name).toBe('Work');
      expect(tag.icon).toBe('💼');
      expect(tag.color).toBe('#3b82f6');
      expect(tag.defaultCapacity).toBe(25);
    });

    it('should throw for empty name', () => {
      expect(() => Tag.create({
        name: '',
        icon: '📌',
        color: '#000000',
        defaultCapacity: 10
      })).toThrow('Tag name cannot be empty');
    });

    it('should throw for invalid capacity (zero)', () => {
      expect(() => Tag.create({
        name: 'Test',
        icon: '📌',
        color: '#000000',
        defaultCapacity: 0
      })).toThrow('Default capacity must be greater than 0');
    });

    it('should throw for negative capacity', () => {
      expect(() => Tag.create({
        name: 'Test',
        icon: '📌',
        color: '#000000',
        defaultCapacity: -5
      })).toThrow('Default capacity must be greater than 0');
    });

    it('should trim name', () => {
      const tag = Tag.create({
        name: '  Work  ',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      });
      expect(tag.name).toBe('Work');
    });
  });

  describe('createUntagged', () => {
    it('should create the special untagged tag', () => {
      const tag = Tag.createUntagged();

      expect(tag.id).toBe('untagged');
      expect(tag.name).toBe('Untagged');
      expect(tag.icon).toBe('📦');
      expect(tag.isUntagged()).toBe(true);
    });
  });

  describe('isUntagged', () => {
    it('should return true for untagged tag', () => {
      const tag = Tag.createUntagged();
      expect(tag.isUntagged()).toBe(true);
    });

    it('should return false for normal tags', () => {
      const tag = Tag.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      });
      expect(tag.isUntagged()).toBe(false);
    });
  });

  describe('updateName', () => {
    it('should update the tag name', () => {
      const tag = Tag.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      });
      const updated = tag.updateName('Office');
      expect(updated.name).toBe('Office');
    });

    it('should throw for empty name', () => {
      const tag = Tag.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      });
      expect(() => tag.updateName('')).toThrow('Tag name cannot be empty');
    });

    it('should throw when updating untagged tag', () => {
      const tag = Tag.createUntagged();
      expect(() => tag.updateName('New Name')).toThrow(
        'Cannot modify the Untagged tag'
      );
    });

    it('should not mutate original', () => {
      const tag = Tag.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      });
      tag.updateName('Office');
      expect(tag.name).toBe('Work');
    });
  });

  describe('updateIcon', () => {
    it('should update the tag icon', () => {
      const tag = Tag.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      });
      const updated = tag.updateIcon('🏢');
      expect(updated.icon).toBe('🏢');
    });

    it('should throw when updating untagged tag', () => {
      const tag = Tag.createUntagged();
      expect(() => tag.updateIcon('📁')).toThrow(
        'Cannot modify the Untagged tag'
      );
    });
  });

  describe('updateColor', () => {
    it('should update the tag color', () => {
      const tag = Tag.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      });
      const updated = tag.updateColor('#ff0000');
      expect(updated.color).toBe('#ff0000');
    });
  });

  describe('updateDefaultCapacity', () => {
    it('should update the default capacity', () => {
      const tag = Tag.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      });
      const updated = tag.updateDefaultCapacity(30);
      expect(updated.defaultCapacity).toBe(30);
    });

    it('should throw for invalid capacity', () => {
      const tag = Tag.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      });
      expect(() => tag.updateDefaultCapacity(0)).toThrow(
        'Default capacity must be greater than 0'
      );
    });
  });

  describe('fromObject', () => {
    it('should recreate tag from object', () => {
      const obj = {
        id: 'tag-123',
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      };

      const tag = Tag.fromObject(obj);

      expect(tag.id).toBe('tag-123');
      expect(tag.name).toBe('Work');
      expect(tag.icon).toBe('💼');
      expect(tag.color).toBe('#3b82f6');
      expect(tag.defaultCapacity).toBe(25);
    });
  });

  describe('toObject', () => {
    it('should serialize tag to object', () => {
      const tag = Tag.create({
        name: 'Work',
        icon: '💼',
        color: '#3b82f6',
        defaultCapacity: 25
      });
      const obj = tag.toObject();

      expect(obj.id).toBe(tag.id);
      expect(obj.name).toBe('Work');
      expect(obj.icon).toBe('💼');
      expect(obj.color).toBe('#3b82f6');
      expect(obj.defaultCapacity).toBe(25);
    });
  });
});
