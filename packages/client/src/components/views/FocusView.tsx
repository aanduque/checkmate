import React from 'react';
import { useStore } from 'statux';
import { useTasks } from '../../hooks/useTasks';
import { useSessions } from '../../hooks/useSessions';
import { useRoutines } from '../../hooks/useRoutines';

export function FocusView() {
  const [tasks] = useStore<any[]>('tasks');
  const [tags] = useStore<any[]>('tags');
  const { skipTaskForNow, skipTaskForDay } = useTasks();
  const { activeSession, startSession } = useSessions();
  const { activeRoutine, getFilteredTasks } = useRoutines();
  const [, setTaskDetailModal] = useStore('ui.modals.taskDetail');
  const [, setSelectedTaskId] = useStore('ui.selectedTaskId');
  const [, setSkipForDayModal] = useStore('ui.modals.skipForDay');

  // Get tasks filtered by active routine
  const filteredTasks = getFilteredTasks(tasks);

  // Filter to only show tasks in current sprint that aren't completed/cancelled/skipped
  const availableTasks = filteredTasks.filter(
    (t: any) =>
      t.status === 'active' &&
      t.sprintId &&
      !t.skipState
  );

  // Sort by total points (descending)
  const sortedTasks = [...availableTasks].sort((a, b) => {
    const aPoints = Object.values(a.tagPoints || {}).reduce((sum: number, p: any) => sum + p, 0) as number;
    const bPoints = Object.values(b.tagPoints || {}).reduce((sum: number, p: any) => sum + p, 0) as number;
    return bPoints - aPoints;
  });

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

  const handleSkipForNow = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    await skipTaskForNow(taskId);
  };

  const handleSkipForDay = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setSelectedTaskId(taskId);
    setSkipForDayModal(true);
  };

  const handleStartSession = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    await startSession(taskId);
  };

  if (activeSession) {
    return (
      <div className="max-w-md mx-auto p-4">
        <div className="text-center py-12">
          <ion-icon name="radio-button-on-outline" class="text-6xl text-primary mb-4"></ion-icon>
          <h2 className="text-2xl font-bold mb-2">Focus Mode Active</h2>
          <p className="text-base-content/60">
            Complete or abandon your current session using the banner above.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">What to Focus On</h2>
        {activeRoutine ? (
          <p className="text-sm text-base-content/60">
            Showing tasks for <span className="font-medium">{activeRoutine.name}</span> routine
          </p>
        ) : (
          <p className="text-sm text-base-content/60">
            No active routine - showing all tasks
          </p>
        )}
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-lg">
          <ion-icon name="checkmark-circle-outline" class="text-6xl text-success mb-4"></ion-icon>
          <h3 className="text-lg font-medium mb-2">All caught up!</h3>
          <p className="text-base-content/60">
            No tasks available for focus right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTasks.map((task: any, index: number) => (
            <div
              key={task.id}
              onClick={() => handleTaskClick(task.id)}
              className={`bg-base-100 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                index === 0 ? 'ring-2 ring-primary' : ''
              }`}
            >
              {index === 0 && (
                <div className="text-xs text-primary font-medium mb-2">
                  RECOMMENDED
                </div>
              )}

              <h3 className="font-medium mb-2">{task.title}</h3>

              <div className="flex flex-wrap gap-1 mb-3">
                {Object.entries(task.tagPoints || {}).map(([tagId, points]) => (
                  <span
                    key={tagId}
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: getTagColor(tagId) + '20',
                      color: getTagColor(tagId),
                    }}
                  >
                    {getTagName(tagId)}: {points as number}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleStartSession(e, task.id)}
                  className="btn btn-primary btn-sm flex-1"
                >
                  <ion-icon name="play-outline"></ion-icon>
                  Start Focus
                </button>
                <button
                  onClick={(e) => handleSkipForNow(e, task.id)}
                  className="btn btn-ghost btn-sm"
                  title="Skip for now"
                >
                  <ion-icon name="arrow-forward-outline"></ion-icon>
                </button>
                <button
                  onClick={(e) => handleSkipForDay(e, task.id)}
                  className="btn btn-ghost btn-sm"
                  title="Skip for day"
                >
                  <ion-icon name="calendar-outline"></ion-icon>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
