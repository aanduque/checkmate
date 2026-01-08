/**
 * FileStorage - Implements Storage interface with JSON file persistence
 *
 * Provides localStorage-like API backed by a JSON file on disk.
 * Data is persisted immediately on every write.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

export class FileStorage implements Storage {
  private data: Map<string, string> = new Map();
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  get length(): number {
    return this.data.size;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
    this.save();
  }

  removeItem(key: string): void {
    this.data.delete(key);
    this.save();
  }

  clear(): void {
    this.data.clear();
    this.save();
  }

  private load(): void {
    try {
      if (existsSync(this.filePath)) {
        const content = readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(content);
        this.data = new Map(Object.entries(parsed));
      }
    } catch (err) {
      console.warn(`Failed to load storage from ${this.filePath}:`, err);
      this.data = new Map();
    }
  }

  private save(): void {
    try {
      // Ensure directory exists
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      const obj: Record<string, string> = {};
      for (const [key, value] of this.data) {
        obj[key] = value;
      }
      writeFileSync(this.filePath, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Failed to save storage to ${this.filePath}:`, err);
    }
  }
}
