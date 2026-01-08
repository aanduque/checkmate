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
}

type FocusLevel = 'distracted' | 'neutral' | 'focused';

const focusOptions: { value: FocusLevel; label: string; icon: string; description: string }[] = [
  {
    value: 'distracted',
    label: 'Distracted',
    icon: '😵',
    description: 'Hard to concentrate, lots of interruptions'
  },
  {
    value: 'neutral',
    label: 'Neutral',
    icon: '😐',
    description: 'Some focus, some distractions'
  },
  {
    value: 'focused',
    label: 'Focused',
    icon: '🎯',
    description: 'In the zone, deep work achieved'
  }
];

export function EndSessionModal({
  isOpen,
  onClose,
  onEnded,
  taskId,
  sessionId,
  taskTitle
}: EndSessionModalProps) {
  const [focusLevel, setFocusLevel] = useState<FocusLevel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!focusLevel) {
      setError('Please select your focus level');
      return;
    }

    try {
      setLoading(true);
      await sessionApi.end(taskId, sessionId, focusLevel);
      onEnded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="End Focus Session">
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <p className="mb-4">
        Great work on <strong>{taskTitle}</strong>! How was your focus?
      </p>

      <div className="space-y-2 mb-6">
        {focusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
              focusLevel === option.value
                ? 'border-primary bg-primary/10'
                : 'border-base-300 hover:border-base-content/30'
            }`}
            onClick={() => setFocusLevel(option.value)}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{option.icon}</span>
              <div>
                <div className="font-semibold">{option.label}</div>
                <div className="text-sm text-base-content/70">{option.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading || !focusLevel}
          onClick={handleSubmit}
        >
          {loading ? <span className="loading loading-spinner loading-sm" /> : 'End Session'}
        </button>
      </div>
    </Modal>
  );
}
