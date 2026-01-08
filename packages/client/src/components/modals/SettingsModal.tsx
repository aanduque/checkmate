import React, { useState } from 'react';
import { useStore } from 'statux';
import { api } from '../../services/rpcClient';

export function SettingsModal() {
  const [isOpen, setIsOpen] = useStore<boolean>('ui.modals.settings');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'system') {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', systemDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Are you sure you want to reset ALL data? This cannot be undone.')) {
      return;
    }
    if (!confirm('This will delete all tasks, tags, routines, and sprints. Are you REALLY sure?')) {
      return;
    }

    try {
      await api.data.reset();
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset data:', error);
      alert('Failed to reset data');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Settings</h3>
          <button onClick={handleClose} className="btn btn-ghost btn-sm btn-square">
            <ion-icon name="close-outline" class="text-xl"></ion-icon>
          </button>
        </div>

        {/* Theme Setting */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-medium">Theme</span>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleThemeChange('light')}
              className={`btn flex-1 ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <ion-icon name="sunny-outline"></ion-icon>
              Light
            </button>
            <button
              onClick={() => handleThemeChange('dark')}
              className={`btn flex-1 ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <ion-icon name="moon-outline"></ion-icon>
              Dark
            </button>
            <button
              onClick={() => handleThemeChange('system')}
              className={`btn flex-1 ${theme === 'system' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <ion-icon name="desktop-outline"></ion-icon>
              System
            </button>
          </div>
        </div>

        {/* About Section */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">About Check Mate</h4>
          <p className="text-sm text-base-content/60 mb-2">
            An ADHD-focused task management system that helps you focus on what matters
            most right now, using points-based prioritization and focus sessions.
          </p>
          <p className="text-sm text-base-content/40">Version 1.0.0 (MVP)</p>
        </div>

        {/* Danger Zone */}
        <div className="border border-error rounded-lg p-4">
          <h4 className="font-medium text-error mb-2">Danger Zone</h4>
          <p className="text-sm text-base-content/60 mb-4">
            These actions are irreversible. Make sure to export a backup first.
          </p>
          <button onClick={handleResetData} className="btn btn-error btn-outline w-full">
            <ion-icon name="trash-outline"></ion-icon>
            Reset All Data
          </button>
        </div>

        <div className="modal-action">
          <button onClick={handleClose} className="btn btn-primary">
            Done
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
