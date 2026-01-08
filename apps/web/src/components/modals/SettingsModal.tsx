import React from 'react';
import { useStore } from 'statux';
import type { AppState } from '../../store';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useStore<AppState['settings']>('settings');

  const handleDurationChange = (duration: number) => {
    setSettings(prev => ({ ...prev, defaultSessionDuration: duration }));
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone!')) {
      if (confirm('This will delete all tasks, tags, sprints, and settings. Continue?')) {
        // Clear localStorage
        localStorage.removeItem('checkmate_tasks');
        localStorage.removeItem('checkmate_tags');
        localStorage.removeItem('checkmate_sprints');
        localStorage.removeItem('checkmate_routines');
        localStorage.removeItem('checkmate_settings');
        localStorage.removeItem('checkmate_currentView');
        localStorage.removeItem('checkmate_manualRoutineId');
        localStorage.removeItem('checkmate_theme');

        // Reload page
        window.location.reload();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-md">
        {/* Close Button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold mb-4">Settings</h3>

        <div className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Default Session Duration</span>
            </label>
            <select
              value={settings.defaultSessionDuration}
              onChange={(e) => handleDurationChange(parseInt(e.target.value))}
              className="select select-bordered w-full"
            >
              <option value={15}>15 minutes</option>
              <option value={25}>25 minutes (Pomodoro)</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>

          <div className="divider"></div>

          <div>
            <h4 className="font-medium text-error mb-2">Danger Zone</h4>
            <button
              onClick={handleResetData}
              className="btn btn-error btn-outline w-full gap-2"
            >
              <ion-icon name="trash-outline"></ion-icon>
              Reset All Data
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
