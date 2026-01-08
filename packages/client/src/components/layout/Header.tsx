import React from 'react';
import { useStore } from 'statux';
import { useRoutines } from '../../hooks/useRoutines';
import { formatDate } from '../../utils/dateUtils';
import type { Routine } from '../../store';

export function Header() {
  const [, setTagsModal] = useStore('ui.modals.tags');
  const [, setRoutinesModal] = useStore('ui.modals.routines');
  const [, setSettingsModal] = useStore('ui.modals.settings');
  const { routines, activeRoutine, manualRoutineId, setManualRoutineId, clearRoutineOverride } = useRoutines();

  return (
    <header className="bg-base-100 shadow-sm p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <ion-icon name="checkbox-outline" class="text-3xl text-primary"></ion-icon>
            <div>
              <h1 className="text-2xl font-bold">Check Mate</h1>
              <p className="text-sm text-base-content/60">ADHD-Focused Task Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            {/* Active Routine Indicator */}
            {activeRoutine && (
              <div
                className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: activeRoutine.color + '20',
                  color: activeRoutine.color,
                }}
              >
                <span>{activeRoutine.icon}</span>
                <span>{activeRoutine.name}</span>
                <button
                  onClick={clearRoutineOverride}
                  className="ml-1 opacity-60 hover:opacity-100"
                  title="Clear override"
                >
                  <ion-icon name="close-outline"></ion-icon>
                </button>
              </div>
            )}

            {/* Manual Routine Selector */}
            <select
              value={manualRoutineId}
              onChange={(e) => setManualRoutineId(e.target.value)}
              className="select select-bordered select-sm"
            >
              <option value="">Auto Routine</option>
              {routines.map((routine) => (
                <option key={routine.id} value={routine.id}>
                  {routine.icon} {routine.name}
                </option>
              ))}
            </select>

            {/* Current Date */}
            <div className="text-sm text-base-content/60">
              {formatDate(new Date())}
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setTagsModal(true)}
              className="btn btn-ghost btn-sm btn-square"
              title="Manage Tags"
            >
              <ion-icon name="pricetag-outline"></ion-icon>
            </button>
            <button
              onClick={() => setRoutinesModal(true)}
              className="btn btn-ghost btn-sm btn-square"
              title="Manage Routines"
            >
              <ion-icon name="sync-outline"></ion-icon>
            </button>
            <button
              onClick={() => setSettingsModal(true)}
              className="btn btn-ghost btn-sm btn-square"
              title="Settings"
            >
              <ion-icon name="settings-outline"></ion-icon>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
