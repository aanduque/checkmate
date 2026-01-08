import React, { useState, useEffect } from 'react';
import { useStore, useSelector } from 'statux';
import type { AppState } from '../../store';
import type { TaskDTO } from '../../services/rpcClient';

export function ActiveSessionBanner() {
  const activeSession = useSelector<AppState['ui']['activeSession']>('ui.activeSession');
  const tasks = useSelector<TaskDTO[]>('tasks');
  const [ui, setUi] = useStore<AppState['ui']>('ui');
  const [elapsed, setElapsed] = useState(0);

  // Find the task for the active session
  const task = activeSession ? tasks.find(t => t.id === activeSession.taskId) : null;

  // Timer effect
  useEffect(() => {
    if (!activeSession) {
      setElapsed(0);
      return;
    }

    const startTime = new Date(activeSession.startedAt).getTime();

    const updateElapsed = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      setElapsed(elapsedSeconds);
      setUi(prev => ({ ...prev, sessionElapsed: elapsedSeconds }));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.startedAt, setUi]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    setUi(prev => ({
      ...prev,
      modals: { ...prev.modals, completeSession: true }
    }));
  };

  const handleAbandon = () => {
    // Clear the active session
    setUi(prev => ({
      ...prev,
      activeSession: null,
      sessionElapsed: 0
    }));
    // TODO: Call RPC to abandon session when backend supports it
  };

  if (!activeSession || !task) {
    return null;
  }

  return (
    <div className="alert alert-info shadow-lg mx-4 mt-4">
      <ion-icon name="radio-button-on-outline" class="text-2xl animate-pulse"></ion-icon>
      <div className="flex-1">
        <p className="text-sm opacity-80">Focusing on</p>
        <p className="font-bold">{task.title}</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-mono font-bold">{formatTime(elapsed)}</p>
      </div>
      <div className="flex gap-1">
        <button
          onClick={handleComplete}
          className="btn btn-success btn-sm btn-circle"
          title="Complete session"
        >
          <ion-icon name="checkmark-outline"></ion-icon>
        </button>
        <button
          onClick={handleAbandon}
          className="btn btn-ghost btn-sm btn-circle"
          title="Abandon session"
        >
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </div>
    </div>
  );
}
