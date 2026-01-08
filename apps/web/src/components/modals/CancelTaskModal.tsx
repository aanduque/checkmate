import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { taskApi } from '../../services/rpcClient';

interface CancelTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCanceled: () => void;
  taskId: string;
  taskTitle: string;
}

export function CancelTaskModal({ isOpen, onClose, onCanceled, taskId, taskTitle }: CancelTaskModalProps) {
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setJustification('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      setError('Justification is required');
      return;
    }

    try {
      setLoading(true);
      await taskApi.cancel(taskId, justification.trim());
      onCanceled();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Task">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <p className="mb-4">
          Are you sure you want to cancel <strong>{taskTitle}</strong>?
        </p>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Why are you canceling this task?</span>
          </label>
          <textarea
            className="textarea textarea-bordered h-24"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="e.g., No longer needed, duplicate task, scope changed..."
            autoFocus
          />
          <label className="label">
            <span className="label-text-alt text-base-content/60">
              A justification helps you track why tasks were canceled
            </span>
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Keep Task
          </button>
          <button
            type="submit"
            className="btn btn-error gap-2"
            disabled={loading || !justification.trim()}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <ion-icon name="close-circle-outline"></ion-icon>
                Cancel Task
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
