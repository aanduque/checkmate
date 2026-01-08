import React from 'react';
import type { TagDTO } from '../../services/rpcClient';
import type { ExtendedTaskDTO } from '../../mocks/mockData';

interface TaskCardProps {
  task: ExtendedTaskDTO;
  variant: 'backlog' | 'sprint';
  onOpenDetail: () => void;
  onComplete?: () => void;
  onStartSession?: () => void;
  isSessionActive?: boolean;
  hasActiveSession?: boolean;
  getTaskPrimaryTag: (task: ExtendedTaskDTO) => TagDTO | undefined;
  getTagById: (tagId: string) => TagDTO | undefined;
}

export function TaskCard({
  task,
  variant,
  onOpenDetail,
  onComplete,
  onStartSession,
  isSessionActive = false,
  hasActiveSession = false,
  getTaskPrimaryTag,
  getTagById
}: TaskCardProps) {
  const primaryTag = getTaskPrimaryTag(task);
  const borderColor = primaryTag?.color || '#888';
  const isSkipped = !!task.skipState;

  return (
    <div
      data-id={task.id}
      className={`kanban-task bg-base-100 rounded-lg p-3 cursor-grab active:cursor-grabbing shadow-sm border-l-4 ${
        isSkipped ? 'opacity-50' : ''
      }`}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex items-center gap-2">
        {/* Complete checkbox - only for sprint tasks */}
        {variant === 'sprint' && onComplete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}
            className="btn btn-ghost btn-circle btn-xs flex-shrink-0"
            title="Complete task"
          >
            <ion-icon name="ellipse-outline" class="text-base"></ion-icon>
          </button>
        )}

        {/* Task title */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{task.title}</p>
        </div>

        {/* Tag points badges */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {Object.entries(task.tagPoints).map(([tagId, points]) => {
            const tag = getTagById(tagId);
            if (!tag) return null;
            return (
              <span
                key={tagId}
                className="badge badge-xs"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color
                }}
              >
                {points}
              </span>
            );
          })}

          {/* Skipped badge */}
          {isSkipped && (
            <span className="badge badge-xs badge-warning">skipped</span>
          )}

          {/* Start session button - only for sprint tasks */}
          {variant === 'sprint' && onStartSession && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartSession();
              }}
              disabled={hasActiveSession}
              className={`btn btn-ghost btn-circle btn-xs ${
                isSessionActive ? 'text-success animate-pulse' : 'text-success'
              }`}
              title={isSessionActive ? 'Session active' : 'Start session'}
            >
              <ion-icon name={isSessionActive ? 'pause-outline' : 'play-outline'}></ion-icon>
            </button>
          )}

          {/* Detail button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            className="btn btn-ghost btn-circle btn-xs"
            title="View details"
          >
            <ion-icon name="ellipsis-vertical-outline"></ion-icon>
          </button>
        </div>
      </div>
    </div>
  );
}
