import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface AddManualSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
  taskId: string;
  taskTitle: string;
}

type FocusLevel = 'distracted' | 'neutral' | 'focused';

export function AddManualSessionModal({
  isOpen,
  onClose,
  onAdded,
  taskId,
  taskTitle
}: AddManualSessionModalProps) {
  const [duration, setDuration] = useState(25);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [focusLevel, setFocusLevel] = useState<FocusLevel>('neutral');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!duration || duration < 1) {
      setError('Please enter a valid duration');
      return;
    }

    try {
      setLoading(true);
      // TODO: Call RPC to add manual session when backend ready
      console.log('Adding manual session:', {
        taskId,
        duration,
        date,
        focusLevel,
        note
      });

      onAdded();
      onClose();

      // Reset form
      setDuration(25);
      setDate(new Date().toISOString().split('T')[0]);
      setFocusLevel('neutral');
      setNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add session');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Manual Session">
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* Task Reference */}
      <div className="bg-base-200 rounded-lg p-3 mb-4">
        <p className="font-medium">{taskTitle}</p>
      </div>

      <div className="space-y-4">
        {/* Duration */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Duration (minutes)</span>
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            min={1}
            max={480}
            className="input input-bordered"
            placeholder="25"
          />
        </div>

        {/* Date */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Date</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input input-bordered"
          />
        </div>

        {/* Focus Level */}
        <div className="form-control">
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
              <ion-icon name="happy-outline"></ion-icon> Focused
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Note (optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="textarea textarea-bordered"
            placeholder="What did you work on?"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={handleClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading || !duration || duration < 1}
          onClick={handleSubmit}
        >
          {loading ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            'Add Session'
          )}
        </button>
      </div>
    </Modal>
  );
}
