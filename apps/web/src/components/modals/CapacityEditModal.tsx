import React, { useState, useEffect } from 'react';
import type { TagDTO } from '../../services/rpcClient';
import type { ExtendedSprintDTO } from '../../mocks/mockData';

interface CapacityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tag: TagDTO | null;
  sprint: ExtendedSprintDTO | null;
  onSave: (tagId: string, capacity: number) => void;
}

export function CapacityEditModal({
  isOpen,
  onClose,
  tag,
  sprint,
  onSave
}: CapacityEditModalProps) {
  const [capacityValue, setCapacityValue] = useState<number>(0);

  // Initialize capacity value when modal opens
  useEffect(() => {
    if (tag && sprint) {
      const currentCapacity = sprint.capacityOverrides?.[tag.id] || tag.defaultCapacity;
      setCapacityValue(currentCapacity);
    }
  }, [tag, sprint]);

  const handleSave = () => {
    if (tag) {
      onSave(tag.id, capacityValue);
      onClose();
    }
  };

  if (!isOpen || !tag || !sprint) return null;

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-sm">
        {/* Close Button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold mb-4">Edit Capacity</h3>

        <div className="flex items-center gap-2 mb-4" style={{ color: tag.color }}>
          <span className="text-2xl">{tag.icon}</span>
          <span className="font-medium">{tag.name}</span>
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Capacity for this sprint</span>
          </label>
          <input
            type="number"
            value={capacityValue}
            onChange={(e) => setCapacityValue(parseInt(e.target.value) || 0)}
            min={1}
            className="input input-bordered"
          />
          <label className="label">
            <span className="label-text-alt">Default: {tag.defaultCapacity} points</span>
          </label>
        </div>

        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-primary">
            Save
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
