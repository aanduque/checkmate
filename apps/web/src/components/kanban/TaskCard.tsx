import React from 'react';
import { TaskDTO } from '../../services/rpcClient';

interface TaskCardProps {
  task: TaskDTO;
  onAction: (action: 'complete' | 'cancel') => void;
  showActions?: boolean;
}

export function TaskCard({ task, onAction, showActions = true }: TaskCardProps) {
  return (
    <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body p-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className={`font-medium text-sm ${task.status !== 'active' ? 'line-through opacity-60' : ''}`}>
            {task.title}
          </h4>
          <span className="badge badge-sm">{task.totalPoints}</span>
        </div>

        {/* Tags */}
        {task.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-1">
            {task.tags.map(tag => (
              <span
                key={tag.id}
                className="badge badge-xs"
                style={{ backgroundColor: tag.color, color: 'white' }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        {showActions && task.status === 'active' && (
          <div className="flex justify-end gap-1 mt-2">
            <button
              className="btn btn-xs btn-ghost"
              onClick={() => onAction('cancel')}
              title="Cancel"
            >
              ✕
            </button>
            <button
              className="btn btn-xs btn-success"
              onClick={() => onAction('complete')}
              title="Complete"
            >
              ✓
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
