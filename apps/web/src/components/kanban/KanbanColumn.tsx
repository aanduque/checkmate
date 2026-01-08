import React, { RefObject } from 'react';
import type { TagDTO } from '../../services/rpcClient';
import type { ExtendedTaskDTO } from '../../mocks/mockData';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  title: string;
  icon: string;
  iconClass: string;
  tasks: ExtendedTaskDTO[];
  recurringTemplates?: ExtendedTaskDTO[];
  columnRef: RefObject<HTMLDivElement>;
  columnId: string;
  variant: 'backlog' | 'sprint';
  sprintHealth?: 'on_track' | 'at_risk' | 'off_track';
  daysRemaining?: number;
  onOpenTaskDetail: (task: ExtendedTaskDTO) => void;
  onCompleteTask?: (taskId: string) => void;
  onStartSession?: (taskId: string) => void;
  activeSessionTaskId?: string;
  getTaskPrimaryTag: (task: ExtendedTaskDTO) => TagDTO | undefined;
  getTagById: (tagId: string) => TagDTO | undefined;
  defaultOpen?: boolean;
}

export function KanbanColumn({
  title,
  icon,
  iconClass,
  tasks,
  recurringTemplates = [],
  columnRef,
  columnId,
  variant,
  sprintHealth,
  daysRemaining,
  onOpenTaskDetail,
  onCompleteTask,
  onStartSession,
  activeSessionTaskId,
  getTaskPrimaryTag,
  getTagById,
  defaultOpen = false
}: KanbanColumnProps) {
  const totalPoints = tasks.reduce((sum, task) => sum + task.totalPoints, 0);

  const healthBadgeClass = sprintHealth
    ? {
        on_track: 'badge-success',
        at_risk: 'badge-warning',
        off_track: 'badge-error'
      }[sprintHealth]
    : '';

  const badgeClass = variant === 'backlog' ? 'badge-accent' : 'badge-primary';

  return (
    <div className="kanban-column flex-1 min-w-0 md:min-w-[280px]">
      <div className="collapse collapse-arrow bg-base-100 shadow-sm md:collapse-open">
        <input
          type="checkbox"
          className="md:hidden"
          defaultChecked={defaultOpen}
        />
        <div className="collapse-title font-medium flex items-center gap-2 py-3">
          <ion-icon name={icon} class={iconClass}></ion-icon>
          <span>{title}</span>
          <span className={`badge badge-sm ${badgeClass}`}>{tasks.length}</span>
          {daysRemaining !== undefined && sprintHealth && (
            <span className={`badge badge-xs ml-auto ${healthBadgeClass}`}>
              {daysRemaining}d
            </span>
          )}
        </div>
        <div className="collapse-content p-0">
          {/* Regular tasks (draggable) */}
          <div
            ref={columnRef}
            data-column={columnId}
            className="kanban-column-content space-y-2 p-2 bg-base-200/50 min-h-[50px]"
          >
            {tasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                variant={variant}
                onOpenDetail={() => onOpenTaskDetail(task)}
                onComplete={onCompleteTask ? () => onCompleteTask(task.id) : undefined}
                onStartSession={onStartSession ? () => onStartSession(task.id) : undefined}
                isSessionActive={activeSessionTaskId === task.id}
                hasActiveSession={!!activeSessionTaskId}
                getTaskPrimaryTag={getTaskPrimaryTag}
                getTagById={getTagById}
              />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-4 text-base-content/50 text-sm italic">
                No tasks
              </div>
            )}
          </div>

          {/* Recurring Templates (NOT draggable) - Only in backlog */}
          {variant === 'backlog' && recurringTemplates.length > 0 && (
            <div className="border-t border-base-300">
              <div className="px-3 py-2 text-xs font-medium opacity-60 flex items-center gap-1 bg-base-200/30">
                <ion-icon name="repeat-outline"></ion-icon>
                <span>Recurring Templates</span>
                <span className="badge badge-xs">{recurringTemplates.length}</span>
              </div>
              <div className="space-y-2 p-2 bg-base-200/50 rounded-b-lg">
                {recurringTemplates.map(task => (
                  <div
                    key={task.id}
                    onClick={() => onOpenTaskDetail(task)}
                    className="kanban-task bg-base-100 rounded-lg p-3 cursor-pointer shadow-sm border-l-4 border-secondary"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <p className="text-xs opacity-60 mt-1">
                          {task.description || 'Recurring task'}
                        </p>
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
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
                        </div>
                      </div>
                      <ion-icon
                        name="chevron-forward-outline"
                        class="opacity-40 flex-shrink-0"
                      ></ion-icon>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
