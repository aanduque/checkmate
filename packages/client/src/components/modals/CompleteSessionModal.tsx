import React, { useState } from 'react';
import { useStore } from 'statux';
import { useSessions } from '../../hooks/useSessions';

type FocusLevel = 'deep' | 'moderate' | 'shallow' | 'distracted';

const FOCUS_LEVELS: { value: FocusLevel; label: string; description: string; color: string }[] = [
  {
    value: 'deep',
    label: 'Deep Focus',
    description: 'Fully immersed, minimal distractions',
    color: 'success',
  },
  {
    value: 'moderate',
    label: 'Moderate Focus',
    description: 'Good focus with some interruptions',
    color: 'info',
  },
  {
    value: 'shallow',
    label: 'Shallow Focus',
    description: 'Frequent interruptions, struggled to focus',
    color: 'warning',
  },
  {
    value: 'distracted',
    label: 'Distracted',
    description: 'Couldn\'t focus, many interruptions',
    color: 'error',
  },
];

export function CompleteSessionModal() {
  const [isOpen, setIsOpen] = useStore<boolean>('ui.modals.completeSession');
  const { completeSession, sessionElapsed, formatSessionTime, getActiveTask } = useSessions();

  const [focusLevel, setFocusLevel] = useState<FocusLevel>('moderate');
  const [completeTask, setCompleteTask] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const task = getActiveTask();

  const handleClose = () => {
    setIsOpen(false);
    setFocusLevel('moderate');
    setCompleteTask(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await completeSession(focusLevel, completeTask);
      handleClose();
    } catch (error) {
      console.error('Failed to complete session:', error);
      alert('Failed to complete session');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Complete Session</h3>

        {task && (
          <div className="mb-4">
            <p className="text-base-content/60">Task:</p>
            <p className="font-medium">{task.title}</p>
          </div>
        )}

        <div className="text-center mb-6">
          <p className="text-4xl font-mono font-bold text-primary">
            {formatSessionTime(sessionElapsed)}
          </p>
          <p className="text-sm text-base-content/60">Session Duration</p>
        </div>

        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-medium">How was your focus?</span>
          </label>
          <div className="space-y-2">
            {FOCUS_LEVELS.map((level) => (
              <label
                key={level.value}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                  focusLevel === level.value
                    ? `border-${level.color} bg-${level.color}/10`
                    : 'border-base-300 hover:border-base-content/20'
                }`}
              >
                <input
                  type="radio"
                  name="focusLevel"
                  value={level.value}
                  checked={focusLevel === level.value}
                  onChange={() => setFocusLevel(level.value)}
                  className={`radio radio-${level.color}`}
                />
                <div className="flex-1">
                  <p className="font-medium">{level.label}</p>
                  <p className="text-sm text-base-content/60">{level.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-control mb-6">
          <label className="label cursor-pointer justify-start gap-3">
            <input
              type="checkbox"
              checked={completeTask}
              onChange={(e) => setCompleteTask(e.target.checked)}
              className="checkbox checkbox-success"
            />
            <span className="label-text">Also mark task as completed</span>
          </label>
        </div>

        <div className="modal-action">
          <button onClick={handleClose} className="btn btn-ghost">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary">
            {submitting ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              'Complete Session'
            )}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
