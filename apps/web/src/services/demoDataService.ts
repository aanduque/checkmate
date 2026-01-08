/**
 * Demo Data Service
 * Handles loading sample data, reset, export/import functionality via RPC
 */

import { devtoolsApi, BackupData } from './rpcClient';

export type { BackupData };

/**
 * Load demo data to the server
 */
export async function loadDemoData(): Promise<boolean> {
  try {
    const result = await devtoolsApi.loadDemoData();
    console.log('Demo data loaded:', result.message);
    return result.success;
  } catch (err) {
    console.error('Failed to load demo data:', err);
    return false;
  }
}

/**
 * Reset all data on the server
 */
export async function resetAllData(): Promise<boolean> {
  try {
    const result = await devtoolsApi.resetAllData();
    console.log('Data reset:', result.message);
    return result.success;
  } catch (err) {
    console.error('Failed to reset data:', err);
    return false;
  }
}

/**
 * Export backup from the server
 */
export async function exportBackup(): Promise<BackupData | null> {
  try {
    const backup = await devtoolsApi.exportBackup();
    return backup;
  } catch (err) {
    console.error('Failed to export backup:', err);
    return null;
  }
}

/**
 * Download backup as a JSON file
 */
export async function downloadBackup(): Promise<void> {
  const backup = await exportBackup();
  if (!backup) {
    alert('Failed to export backup');
    return;
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `checkmate-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import backup to the server
 */
export async function importBackup(backup: BackupData): Promise<boolean> {
  try {
    const result = await devtoolsApi.importBackup(backup);
    console.log('Backup imported:', result.message);
    return result.success;
  } catch (err) {
    console.error('Failed to import backup:', err);
    return false;
  }
}
