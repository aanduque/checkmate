import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { ExportData } from '../export/JsonExporter';

/**
 * File-based persistence for data storage
 */
export class FilePersistence {
  constructor(private readonly filePath: string) {
    // Ensure directory exists
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Load data from file
   */
  load(): ExportData | null {
    try {
      if (!existsSync(this.filePath)) {
        return null;
      }
      const content = readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to load data from file:', e);
      return null;
    }
  }

  /**
   * Save data to file
   */
  save(data: ExportData): void {
    try {
      writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save data to file:', e);
    }
  }

  /**
   * Check if data file exists
   */
  exists(): boolean {
    return existsSync(this.filePath);
  }

  /**
   * Delete data file
   */
  delete(): void {
    try {
      if (existsSync(this.filePath)) {
        const { unlinkSync } = require('fs');
        unlinkSync(this.filePath);
      }
    } catch (e) {
      console.error('Failed to delete data file:', e);
    }
  }
}
