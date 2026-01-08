import React from 'react';
import { useStore } from 'statux';
import { api } from '../../services/rpcClient';

export function Drawer() {
  const [, setTagsModal] = useStore('ui.modals.tags');
  const [, setRoutinesModal] = useStore('ui.modals.routines');
  const [, setSettingsModal] = useStore('ui.modals.settings');
  const [, setImportModal] = useStore('ui.modals.import');

  const handleExport = async () => {
    try {
      const data = await api.data.export();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `checkmate-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed');
    }
  };

  const handleLoadDemo = async () => {
    if (!confirm('This will reset all data and load demo tasks. Continue?')) {
      return;
    }

    try {
      await api.data.reset();
      // Create some demo tasks
      const demoTasks = [
        { title: 'Review quarterly report', tagPoints: { 'Work': 5 } },
        { title: 'Exercise for 30 minutes', tagPoints: { 'Health': 2 } },
        { title: 'Read a chapter of Clean Code', tagPoints: { 'Learning': 3 } },
        { title: 'Plan weekend trip', tagPoints: { 'Personal': 2 } },
      ];

      // Get tags first
      const { tags } = await api.tags.getAll();
      const tagMap: Record<string, string> = {};
      for (const tag of tags) {
        tagMap[tag.name] = tag.id;
      }

      for (const task of demoTasks) {
        const tagPoints: Record<string, number> = {};
        for (const [tagName, points] of Object.entries(task.tagPoints)) {
          if (tagMap[tagName]) {
            tagPoints[tagMap[tagName]] = points;
          }
        }
        if (Object.keys(tagPoints).length > 0) {
          await api.tasks.create({ title: task.title, tagPoints });
        }
      }

      window.location.reload();
    } catch (e) {
      console.error('Failed to load demo:', e);
      alert('Failed to load demo data');
    }
  };

  return (
    <div className="drawer-side z-50">
      <label htmlFor="main-drawer" className="drawer-overlay"></label>
      <div className="menu p-4 w-80 min-h-full bg-base-100">
        <div className="flex items-center gap-3 mb-6 px-2">
          <ion-icon name="checkbox-outline" class="text-3xl text-primary"></ion-icon>
          <span className="text-xl font-bold">Check Mate</span>
        </div>

        <ul className="space-y-2">
          <li>
            <button onClick={() => setTagsModal(true)} className="flex items-center gap-3">
              <ion-icon name="pricetag-outline"></ion-icon>
              Manage Tags
            </button>
          </li>
          <li>
            <button onClick={() => setRoutinesModal(true)} className="flex items-center gap-3">
              <ion-icon name="sync-outline"></ion-icon>
              Manage Routines
            </button>
          </li>
          <li>
            <button onClick={() => setSettingsModal(true)} className="flex items-center gap-3">
              <ion-icon name="settings-outline"></ion-icon>
              Settings
            </button>
          </li>
        </ul>

        <div className="divider"></div>

        <ul className="space-y-2">
          <li>
            <button onClick={handleExport} className="flex items-center gap-3">
              <ion-icon name="download-outline"></ion-icon>
              Export Backup
            </button>
          </li>
          <li>
            <button onClick={() => setImportModal(true)} className="flex items-center gap-3">
              <ion-icon name="cloud-upload-outline"></ion-icon>
              Import Backup
            </button>
          </li>
          <li>
            <button onClick={handleLoadDemo} className="flex items-center gap-3">
              <ion-icon name="flask-outline"></ion-icon>
              Load Demo Data
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
