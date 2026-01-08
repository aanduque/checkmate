import React, { useState } from 'react';
import { useStore } from 'statux';
import { useTasks } from '../../hooks/useTasks';

export function SkipForDayModal() {
  const [isOpen, setIsOpen] = useStore<boolean>('ui.modals.skipForDay');
  const [selectedTaskId] = useStore<string>('ui.selectedTaskId');
  const [tasks] = useStore<any[]>('tasks');
  const { skipTaskForDay } = useTasks();

  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const task = tasks.find((t: any) => t.id === selectedTaskId);

  const handleClose = () => {
    setIsOpen(false);
    setJustification('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !justification.trim()) return;

    setSubmitting(true);
    try {
      await skipTaskForDay(task.id, justification.trim());
      handleClose();
    } catch (error) {
      console.error('Failed to skip task:', error);
      alert('Failed to skip task');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Skip for Today</h3>

        <p className="text-base-content/60 mb-4">
          Skipping: <strong>{task.title}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Why are you skipping this task?</span>
              <span className="label-text-alt">Required</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="e.g., Waiting for client feedback, Need more research, Low energy today..."
              className="textarea textarea-bordered w-full"
              rows={3}
              autoFocus
            />
          </div>

          <div className="alert alert-info mb-4">
            <ion-icon name="information-circle-outline" class="text-xl"></ion-icon>
            <span className="text-sm">
              This task will be hidden for today but will return tomorrow.
            </span>
          </div>

          <div className="modal-action">
            <button type="button" onClick={handleClose} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!justification.trim() || submitting}
              className="btn btn-warning"
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Skip for Today'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
