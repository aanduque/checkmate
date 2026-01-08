import React from 'react';
import { useStore, useSelector } from 'statux';
import type { RoutineDTO, AppState } from '../../store';

export function Drawer() {
  const routines = useSelector<RoutineDTO[]>('routines');
  const [ui, setUi] = useStore<AppState['ui']>('ui');

  const handleRoutineSelect = (routineId: string | null) => {
    setUi(prev => ({
      ...prev,
      manualRoutineId: routineId
    }));
  };

  const openModal = (modalName: keyof AppState['ui']['modals']) => {
    setUi(prev => ({
      ...prev,
      modals: { ...prev.modals, [modalName]: true }
    }));
  };

  return (
    <div className="drawer-side z-20">
      <label htmlFor="main-drawer" className="drawer-overlay" aria-label="close sidebar"></label>
      <div className="menu bg-base-100 min-h-full w-80 p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <ion-icon name="checkbox-outline" class="text-2xl text-primary"></ion-icon>
          <span className="font-bold text-lg">Check Mate</span>
        </div>

        {/* Routine Selector */}
        <div className="mb-6">
          <div className="text-sm font-medium opacity-60 mb-2">Routine</div>
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
              Tags
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost btn-sm justify-start gap-2 w-full"
              onClick={() => openModal('routines')}
            >
              <ion-icon name="time-outline"></ion-icon>
              Routines
            </button>
          </li>
          <li>
            <button
              className="btn btn-ghost btn-sm justify-start gap-2 w-full"
              onClick={() => openModal('import')}
            >
              <ion-icon name="cloud-upload-outline"></ion-icon>
              Import Tasks
            </button>
          </li>
          <li>
            <a href="/settings" className="btn btn-ghost btn-sm justify-start gap-2 w-full">
              <ion-icon name="settings-outline"></ion-icon>
              Settings
            </a>
          </li>
        </ul>

        {/* Sprint Health Summary (placeholder) */}
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

        {/* Dev Tools (collapsible) */}
        <div className="collapse collapse-arrow mt-6">
          <input type="checkbox" />
          <div className="collapse-title text-sm font-medium opacity-60 px-0">
            Dev Tools
          </div>
          <div className="collapse-content px-0">
            <div className="space-y-2">
              <button className="btn btn-xs btn-outline btn-block">
                Load Demo Data
              </button>
              <button className="btn btn-xs btn-outline btn-error btn-block">
                Reset All Data
              </button>
              <button className="btn btn-xs btn-outline btn-block">
                Export Backup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
