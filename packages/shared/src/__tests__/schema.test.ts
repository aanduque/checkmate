/**
 * OpenRPC Schema Tests
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { load } from 'js-yaml';

interface OpenRPCSchema {
  openrpc: string;
  info: { title: string; version: string };
  methods: Array<{
    name: string;
    params: Array<{ name: string; required?: boolean }>;
    result: { name: string };
  }>;
  components?: { schemas?: Record<string, unknown> };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('OpenRPC Schema', () => {
  let schema: OpenRPCSchema;

  beforeAll(() => {
    const yamlPath = path.join(__dirname, '../../openrpc.yaml');
    const yamlContent = fs.readFileSync(yamlPath, 'utf-8');
    schema = load(yamlContent) as OpenRPCSchema;
  });

  it('should have valid OpenRPC version', () => {
    expect(schema.openrpc).toBe('1.3.2');
  });

  it('should have info section with title and version', () => {
    expect(schema.info.title).toBe('Check Mate API');
    expect(schema.info.version).toBeDefined();
  });

  describe('Task Methods', () => {
    it('should have task.create method', () => {
      const method = schema.methods.find(m => m.name === 'task.create');
      expect(method).toBeDefined();
      expect(method?.params).toHaveLength(4);
      expect(method?.params.map(p => p.name)).toEqual(['title', 'description', 'tagPoints', 'sprintId']);
    });

    it('should have task.complete method', () => {
      const method = schema.methods.find(m => m.name === 'task.complete');
      expect(method).toBeDefined();
      expect(method?.params).toHaveLength(1);
      expect(method?.params[0].name).toBe('id');
    });

    it('should have task.cancel method', () => {
      const method = schema.methods.find(m => m.name === 'task.cancel');
      expect(method).toBeDefined();
      expect(method?.params.map(p => p.name)).toEqual(['id', 'justification']);
    });

    it('should have task.skip method', () => {
      const method = schema.methods.find(m => m.name === 'task.skip');
      expect(method).toBeDefined();
      expect(method?.params.map(p => p.name)).toEqual(['id', 'type', 'justification']);
    });

    it('should have task.getKanban method', () => {
      const method = schema.methods.find(m => m.name === 'task.getKanban');
      expect(method).toBeDefined();
    });

    it('should have task.getFocus method', () => {
      const method = schema.methods.find(m => m.name === 'task.getFocus');
      expect(method).toBeDefined();
    });
  });

  describe('Session Methods', () => {
    it('should have session.start method', () => {
      const method = schema.methods.find(m => m.name === 'session.start');
      expect(method).toBeDefined();
      expect(method?.params.map(p => p.name)).toEqual(['taskId', 'durationMinutes']);
    });

    it('should have session.end method', () => {
      const method = schema.methods.find(m => m.name === 'session.end');
      expect(method).toBeDefined();
      expect(method?.params.map(p => p.name)).toEqual(['taskId', 'sessionId', 'focusLevel']);
    });
  });

  describe('Tag Methods', () => {
    it('should have tag.create method', () => {
      const method = schema.methods.find(m => m.name === 'tag.create');
      expect(method).toBeDefined();
    });

    it('should have tag.getAll method', () => {
      const method = schema.methods.find(m => m.name === 'tag.getAll');
      expect(method).toBeDefined();
      expect(method?.params).toHaveLength(0);
    });
  });

  describe('Sprint Methods', () => {
    it('should have sprint.create method', () => {
      const method = schema.methods.find(m => m.name === 'sprint.create');
      expect(method).toBeDefined();
    });

    it('should have sprint.getCurrent method', () => {
      const method = schema.methods.find(m => m.name === 'sprint.getCurrent');
      expect(method).toBeDefined();
      expect(method?.params).toHaveLength(0);
    });

    it('should have sprint.getUpcoming method', () => {
      const method = schema.methods.find(m => m.name === 'sprint.getUpcoming');
      expect(method).toBeDefined();
    });
  });

  describe('Stats Methods', () => {
    it('should have stats.getDaily method', () => {
      const method = schema.methods.find(m => m.name === 'stats.getDaily');
      expect(method).toBeDefined();
    });

    it('should have stats.getWeekly method', () => {
      const method = schema.methods.find(m => m.name === 'stats.getWeekly');
      expect(method).toBeDefined();
    });
  });

  describe('Component Schemas', () => {
    it('should have Task schema', () => {
      expect(schema.components?.schemas?.Task).toBeDefined();
    });

    it('should have Tag schema', () => {
      expect(schema.components?.schemas?.Tag).toBeDefined();
    });

    it('should have Sprint schema', () => {
      expect(schema.components?.schemas?.Sprint).toBeDefined();
    });

    it('should have Session schema', () => {
      expect(schema.components?.schemas?.Session).toBeDefined();
    });

    it('should have FocusLevel enum', () => {
      const focusLevel = schema.components?.schemas?.FocusLevel as { enum?: string[] };
      expect(focusLevel).toBeDefined();
      expect(focusLevel?.enum).toEqual(['distracted', 'neutral', 'focused']);
    });

    it('should have TaskStatus enum', () => {
      const taskStatus = schema.components?.schemas?.TaskStatus as { enum?: string[] };
      expect(taskStatus).toBeDefined();
      expect(taskStatus?.enum).toEqual(['active', 'completed', 'canceled']);
    });
  });
});
