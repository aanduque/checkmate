import React, { useRef, useState } from 'react';
import { useStore, useSelector } from 'statux';
import type { RoutineDTO, AppState } from '../../store';
import {
  loadDemoData,
  resetAllData,
  downloadBackup,
  importBackup,
  BackupData
} from '../../services/demoDataService';

export function Drawer() {
  const routines = useSelector<RoutineDTO[]>('routines');
  const [ui, setUi] = useStore<AppState['ui']>('ui');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleRoutineSelect = (routineId: string | null) => {
    setUi(prev => ({
      ...prev,
      manualRoutineId: routineId
    }));
    closeDrawer();
  };

  const openModal = (modalName: keyof AppState['ui']['modals']) => {
    setUi(prev => ({
      ...prev,
      modals: { ...prev.modals, [modalName]: true }
    }));
    closeDrawer();
  };

  const closeDrawer = () => {
    const drawer = document.getElementById('main-drawer') as HTMLInputElement;
    if (drawer) drawer.checked = false;
  };

  const handleLoadDemoData = async () => {
    setLoading(true);
    try {
      const success = await loadDemoData();
      if (success) {
        closeDrawer();
        window.location.reload();
      } else {
        alert('Failed to load demo data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetAllData = async () => {
    if (confirm('This will delete ALL your data. Are you sure?')) {
      setLoading(true);
      try {
        const success = await resetAllData();
        if (success) {
          closeDrawer();
          window.location.reload();
        } else {
          alert('Failed to reset data');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportBackup = async () => {
    setLoading(true);
    try {
      await downloadBackup();
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      setLoading(true);
      try {
        const backup = JSON.parse(e.target?.result as string) as BackupData;
        const success = await importBackup(backup);
        if (success) {
          closeDrawer();
          window.location.reload();
        } else {
          alert('Failed to import backup. Invalid format.');
        }
      } catch {
        alert('Failed to parse backup file.');
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="drawer-side z-20">
      <label htmlFor="main-drawer" className="drawer-overlay" aria-label="close sidebar"></label>
      <div className="menu bg-base-100 min-h-full w-80 p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <ion-icon name="checkbox-outline" class="text-2xl text-primary"></ion-icon>
          <span className="font-bold text-lg">Check Mate</span>
        </div>

        {/* Routine Selector */}
        <div className="mb-6">
          <p className="text-xs font-medium opacity-50 uppercase mb-2">Active Routine</p>
          <div className="space-y-1">
            {/* Auto Mode */}
            <button
              className={`btn btn-block btn-sm justify-start gap-2 ${
                ui.manualRoutineId === null ? 'btn-primary' : 'btn-ghost'
              }`}
              onClick={() => handleRoutineSelect(null)}
            >
              <ion-icon name="flash-outline"></ion-icon>
              Auto
            </button>

            {/* Planning Mode */}
            <button
              className={`btn btn-block btn-sm justify-start gap-2 ${
                ui.manualRoutineId === '__planning__' ? 'btn-primary' : 'btn-ghost'
              }`}
              onClick={() => handleRoutineSelect('__planning__')}
            >
              <ion-icon name="list-outline"></ion-icon>
              Planning
            </button>

            {/* Manual Routines */}
            {routines.length > 0 && (
              <div className="divider text-xs opacity-50 my-2">Manual Select</div>
            )}
            {routines.map(routine => (
              <button
                key={routine.id}
                className={`btn btn-block btn-sm justify-start gap-2 ${
                  ui.manualRoutineId === routine.id ? 'btn-primary' : 'btn-ghost'
                }`}
                onClick={() => handleRoutineSelect(routine.id)}
                style={ui.manualRoutineId === routine.id ? {} : { color: routine.color }}
              >
                <span>{routine.icon}</span>
                {routine.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="divider text-xs opacity-50">Quick Links</div>
        <ul className="space-y-1">
          <li>
            <button
              className="btn btn-ghost btn-sm justify-start gap-2 w-full"
              onClick={() => openModal('tags')}
            >
              <ion-icon name="pricetags-outline"></ion-icon>
              Manage Tags
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost btn-sm justify-start gap-2 w-full"
              onClick={() => openModal('routines')}
            >
              <ion-icon name="time-outline"></ion-icon>
              Manage Routines
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost btn-sm justify-start gap-2 w-full"
              onClick={() => openModal('import')}
            >
              <ion-icon name="document-text-outline"></ion-icon>
              Import Tasks from Text
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost btn-sm justify-start gap-2 w-full"
              onClick={() => openModal('settings')}
            >
              <ion-icon name="settings-outline"></ion-icon>
              Settings
            </button>
          </li>
        </ul>

        {/* Sprint Health Summary */}
        <div className="divider text-xs opacity-50 mt-6">Sprint Health</div>
        <div className="card bg-base-200">
          <div className="card-body p-3">
            <div className="flex items-center gap-2">
              <div className="badge badge-success badge-sm">On Track</div>
              <span className="text-xs opacity-70">5 days left</span>
            </div>
            <button
              className="btn btn-xs btn-ghost mt-2"
              onClick={() => openModal('sprintHealth')}
            >
              View Details
            </button>
          </div>
        </div>

        {/* Dev Tools (collapsible) - pushed to bottom */}
        <div className="mt-auto pt-4">
          <details className="collapse collapse-arrow bg-base-200 rounded-lg">
            <summary className="collapse-title text-xs font-medium py-2 min-h-0">
              <span className="flex items-center gap-2">
                <ion-icon name="code-slash-outline"></ion-icon>
                Dev Tools
              </span>
            </summary>
            <div className="collapse-content px-2">
              <div className="space-y-2 pt-2">
                <button
                  className="btn btn-sm btn-block btn-ghost justify-start gap-2"
                  onClick={() => openModal('import')}
                >
                  <ion-icon name="document-text-outline"></ion-icon>
                  Import Tasks from Text
                </button>

                <div className="divider my-1 text-xs opacity-50">Backup</div>

                <button
                  className="btn btn-sm btn-block btn-ghost justify-start gap-2"
                  onClick={handleExportBackup}
                >
                  <ion-icon name="cloud-download-outline"></ion-icon>
                  Export Backup
                </button>

                <label className="btn btn-sm btn-block btn-ghost justify-start gap-2 cursor-pointer">
                  <ion-icon name="cloud-upload-outline"></ion-icon>
                  Import Backup
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>

                <div className="divider my-1 text-xs opacity-50">Data</div>

                <button
                  className="btn btn-sm btn-block btn-ghost justify-start gap-2"
                  onClick={handleLoadDemoData}
                >
                  <ion-icon name="download-outline"></ion-icon>
                  Load Demo Data
                </button>

                <button
                  className="btn btn-sm btn-block btn-ghost justify-start gap-2 text-error"
                  onClick={handleResetAllData}
                >
                  <ion-icon name="trash-outline"></ion-icon>
                  Reset All Data
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
