import React, { useState } from 'react';
import { useStore } from 'statux';
import { useTasks } from '../../hooks/useTasks';
import { useSprints } from '../../hooks/useSprints';
import { formatDate } from '../../utils/dateUtils';

export function TasksView() {
  const [tasks] = useStore<any[]>('tasks');
  const [tags] = useStore<any[]>('tags');
  const { moveTask } = useTasks();
  const { getCurrentSprint, getNextSprint } = useSprints();
  const [, setTaskDetailModal] = useStore('ui.modals.taskDetail');
  const [, setSelectedTaskId] = useStore('ui.selectedTaskId');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const currentSprint = getCurrentSprint();
  const nextSprint = getNextSprint();

  const getTasksForColumn = (sprintId: string | null) => {
    return tasks.filter((t: any) => {
      if (sprintId === null) {
        return !t.sprintId && t.status === 'active';
      }
      return t.sprintId === sprintId && t.status === 'active';
    });
  };

  const backlogTasks = getTasksForColumn(null);
  const thisWeekTasks = currentSprint ? getTasksForColumn(currentSprint.id) : [];
  const nextWeekTasks = nextSprint ? getTasksForColumn(nextSprint.id) : [];

  const getTagName = (tagId: string) => {
    const tag = tags.find((t: any) => t.id === tagId);
    return tag?.name || 'Unknown';
  };

  const getTagColor = (tagId: string) => {
    const tag = tags.find((t: any) => t.id === tagId);
    return tag?.color || '#6B7280';
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setTaskDetailModal(true);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, sprintId: string | null) => {
    e.preventDefault();
    if (draggedTaskId) {
      await moveTask(draggedTaskId, sprintId);
      setDraggedTaskId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  const getSprintHealth = (sprint: any) => {
    if (!sprint) return null;
    const health = sprint.health || 'on_track';
    const colors: Record<string, string> = {
      on_track: 'text-success',
      at_risk: 'text-warning',
      off_track: 'text-error',
    };
    const icons: Record<string, string> = {
      on_track: 'checkmark-circle',
      at_risk: 'warning',
      off_track: 'alert-circle',
    };
    return (
      <ion-icon name={icons[health]} class={`text-lg ${colors[health]}`}></ion-icon>
    );
  };

  const renderColumn = (
    title: string,
    tasks: any[],
    sprintId: string | null,
    sprint?: any
  ) => {
    const totalPoints = tasks.reduce((sum, t) => {
      return sum + Object.values(t.tagPoints || {}).reduce((s: number, p: any) => s + p, 0);
    }, 0);

    return (
      <div
        className="flex-1 min-w-[280px] max-w-md bg-base-200 rounded-lg"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, sprintId)}
      >
        <div className="p-3 border-b border-base-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold">{title}</h3>
              {sprint && getSprintHealth(sprint)}
            </div>
            <span className="text-sm text-base-content/60">
              {tasks.length} tasks · {totalPoints} pts
            </span>
          </div>
          {sprint && (
            <p className="text-xs text-base-content/60 mt-1">
              {formatDate(new Date(sprint.startDate))} - {formatDate(new Date(sprint.endDate))}
            </p>
          )}
        </div>

        <div className="p-2 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {tasks.map((task) => (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              onDragEnd={handleDragEnd}
              onClick={() => handleTaskClick(task.id)}
              className={`bg-base-100 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow ${
                draggedTaskId === task.id ? 'opacity-50' : ''
              } ${task.skipState ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <p className="font-medium text-sm">{task.title}</p>

                  {task.skipState && (
                    <p className="text-xs text-warning mt-1">
                      <ion-icon name="arrow-forward-outline" class="mr-1"></ion-icon>
                      {task.skipState.type === 'for_now' ? 'Skipped for now' : 'Skipped for day'}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(task.tagPoints || {}).map(([tagId, points]) => (
                      <span
                        key={tagId}
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{
                          backgroundColor: getTagColor(tagId) + '20',
                          color: getTagColor(tagId),
                        }}
                      >
                        {getTagName(tagId)}: {points as number}
                      </span>
                    ))}
                  </div>

                  {task.sessions && task.sessions.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-base-content/60">
                      <ion-icon name="time-outline"></ion-icon>
                      <span>{task.sessions.length} session(s)</span>
                    </div>
                  )}
                </div>

                {task.recurrence && (
                  <ion-icon
                    name="sync-outline"
                    class="text-base-content/40"
                    title="Recurring task"
                  ></ion-icon>
                )}
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-8 text-base-content/40">
              <ion-icon name="albums-outline" class="text-3xl mb-2"></ion-icon>
              <p className="text-sm">Drop tasks here</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {renderColumn('Backlog', backlogTasks, null)}
        {renderColumn('This Week', thisWeekTasks, currentSprint?.id ?? null, currentSprint)}
        {renderColumn('Next Week', nextWeekTasks, nextSprint?.id ?? null, nextSprint)}
      </div>
    </div>
  );
}
