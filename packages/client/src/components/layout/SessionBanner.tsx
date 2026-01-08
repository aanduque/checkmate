import React from 'react';
import { useStore } from 'statux';
import { useSessions } from '../../hooks/useSessions';

export function SessionBanner() {
  const {
    activeSession,
    sessionElapsed,
    abandonSession,
    formatSessionTime,
    getActiveTask,
  } = useSessions();
  const [, setCompleteSessionModal] = useStore('ui.modals.completeSession');

  if (!activeSession) return null;

  const task = getActiveTask();

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <ion-icon name="radio-button-on-outline" class="text-4xl"></ion-icon>
            <div>
              <p className="text-sm opacity-80">Focusing on</p>
              <p className="font-bold text-lg">{task?.title || 'Unknown task'}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-mono font-bold">
                {formatSessionTime(sessionElapsed)}
              </p>
              <p className="text-xs opacity-80">elapsed</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCompleteSessionModal(true)}
                className="btn btn-success"
              >
                <ion-icon name="checkmark-outline"></ion-icon> Complete
              </button>
              <button
                onClick={abandonSession}
                className="btn btn-ghost text-white/80 hover:text-white"
              >
                <ion-icon name="close-outline"></ion-icon> Abandon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
