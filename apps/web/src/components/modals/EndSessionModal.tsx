import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { sessionApi } from '../../services/rpcClient';

interface EndSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnded: () => void;
  taskId: string;
  sessionId: string;
  taskTitle: string;
  onCompleteTask?: () => void;
}

type FocusLevel = 'distracted' | 'neutral' | 'focused';

export function EndSessionModal({
  isOpen,
  onClose,
  onEnded,
  taskId,
  sessionId,
  taskTitle,
  onCompleteTask
}: EndSessionModalProps) {
  const [focusLevel, setFocusLevel] = useState<FocusLevel>('neutral');
  const [sessionNote, setSessionNote] = useState('');
  const [markTaskComplete, setMarkTaskComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await sessionApi.end(taskId, sessionId, focusLevel);

      if (markTaskComplete && onCompleteTask) {
        onCompleteTask();
      }

      onEnded();
      onClose();

      // Reset form
      setFocusLevel('neutral');
      setSessionNote('');
      setMarkTaskComplete(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Session">
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* Focus Level Selection */}
      <div className="mb-4">
        <label className="label">
          <span className="label-text">How focused were you?</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFocusLevel('distracted')}
            className={`btn btn-sm flex-1 ${
              focusLevel === 'distracted'
                ? 'btn-error'
                : 'btn-ghost bg-error/10 text-error'
            }`}
          >
            <ion-icon name="sad-outline"></ion-icon> Distracted
          </button>
          <button
            type="button"
            onClick={() => setFocusLevel('neutral')}
            className={`btn btn-sm flex-1 ${
              focusLevel === 'neutral'
                ? 'btn-warning'
                : 'btn-ghost bg-warning/10 text-warning'
            }`}
          >
            <ion-icon name="ellipse-outline"></ion-icon> Neutral
          </button>
          <button
            type="button"
            onClick={() => setFocusLevel('focused')}
            className={`btn btn-sm flex-1 ${
              focusLevel === 'focused'
                ? 'btn-success'
                : 'btn-ghost bg-success/10 text-success'
            }`}
          >
            <ion-icon name="radio-button-on-outline"></ion-icon> Focused
          </button>
        </div>
      </div>

      {/* Session Note */}
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Session Note (optional)</span>
        </label>
        <textarea
          value={sessionNote}
          onChange={(e) => setSessionNote(e.target.value)}
          rows={2}
          className="textarea textarea-bordered"
          placeholder="What did you accomplish?"
        />
      </div>

      {/* Mark Task Complete Checkbox */}
      <div className="form-control mb-4">
        <label className="label cursor-pointer justify-start gap-2">
          <input
            type="checkbox"
            checked={markTaskComplete}
            onChange={(e) => setMarkTaskComplete(e.target.checked)}
            className="checkbox checkbox-sm"
          />
          <span className="label-text">Also mark task as complete</span>
        </label>
      </div>

      {/* Actions */}
      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-success"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            'Complete Session'
          )}
        </button>
      </div>
    </Modal>
  );
}

// Also export as CompleteSessionModal for clarity
export { EndSessionModal as CompleteSessionModal };
