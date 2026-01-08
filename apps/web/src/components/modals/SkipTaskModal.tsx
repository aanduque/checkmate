import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { taskApi } from '../../services/rpcClient';

interface SkipTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSkipped: () => void;
  taskId: string;
  taskTitle: string;
  skipType: 'for_now' | 'for_day';
}

export function SkipTaskModal({
  isOpen,
  onClose,
  onSkipped,
  taskId,
  taskTitle,
  skipType
}: SkipTaskModalProps) {
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

    // Skip for day requires justification
    if (skipType === 'for_day' && !justification.trim()) {
      setError('Please provide a reason for skipping this task for the day');
      return;
    }

    try {
      setLoading(true);
      await taskApi.skip(
        taskId,
        skipType,
        justification.trim() || undefined
      );
      onSkipped();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip task');
    } finally {
      setLoading(false);
    }
  };

  const isSkipForDay = skipType === 'for_day';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isSkipForDay ? 'Skip Task for Today' : 'Skip Task for Now'}
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <p className="mb-4">
          {isSkipForDay ? (
            <>
              Skipping <strong>{taskTitle}</strong> will hide it until tomorrow.
            </>
          ) : (
            <>
              Skipping <strong>{taskTitle}</strong> will move it down in the queue.
            </>
          )}
        </p>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">
              {isSkipForDay ? 'Why skip this for today?' : 'Reason (optional)'}
            </span>
          </label>
          <textarea
            className="textarea textarea-bordered h-20"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder={
              isSkipForDay
                ? "e.g., Need supplies, waiting on feedback, low energy..."
                : "Optional: Why are you skipping this?"
            }
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-warning gap-2"
            disabled={loading || (isSkipForDay && !justification.trim())}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              <>
                <ion-icon name={isSkipForDay ? 'calendar-outline' : 'play-skip-forward-outline'}></ion-icon>
                {isSkipForDay ? 'Skip for Today' : 'Skip for Now'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
