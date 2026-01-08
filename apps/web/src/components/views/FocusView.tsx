import React, { useState } from 'react';
import { useStore, useSelector } from 'statux';
import { useFocusTask } from '../../hooks/useFocusTask';
import { SkipTaskModal } from '../modals/SkipTaskModal';
import { EndSessionModal } from '../modals/EndSessionModal';
import { TaskDetailModal } from '../modals/TaskDetailModal';
import type { TagDTO } from '../../services/rpcClient';
import type { AppState } from '../../store';

export function FocusView() {
  const { focusTask, upNext, startSession, completeCurrentTask, skipCurrentTask, getTagById } = useFocusTask();
  const tags = useSelector<TagDTO[]>('tags');
  const activeSession = useSelector<AppState['ui']['activeSession']>('ui.activeSession');
  const [ui, setUi] = useStore<AppState['ui']>('ui');

  // Modal states
  const [skipModalOpen, setSkipModalOpen] = useState(false);
  const [skipType, setSkipType] = useState<'for_now' | 'for_day'>('for_now');
  const [endSessionModalOpen, setEndSessionModalOpen] = useState(false);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);

  const handleStartSession = async () => {
    if (!focusTask) return;
    await startSession(focusTask.id, 25);
  };

  const handleSkipClick = (type: 'for_now' | 'for_day') => {
    setSkipType(type);
    if (type === 'for_now') {
      // Skip for now doesn't need justification
      skipCurrentTask('for_now');
    } else {
      setSkipModalOpen(true);
    }
  };

  const handleComplete = async () => {
    if (!focusTask) return;
    await completeCurrentTask();
  };

  const handleOpenCreateTask = () => {
    setUi(prev => ({
      ...prev,
      modals: { ...prev.modals, createTask: true }
    }));
  };

  const getTaskPrimaryTag = (task: { tagPoints: Record<string, number> }): TagDTO | undefined => {
    const tagIds = Object.keys(task.tagPoints);
    if (tagIds.length === 0) return undefined;
    return tags.find(t => t.id === tagIds[0]);
  };

  // Show task details modal
  const handleOpenTaskDetail = () => {
    setTaskDetailOpen(true);
  };

  if (!focusTask) {
    return (
      <div className="p-4 pb-24 max-w-2xl mx-auto">
        <div className="hero bg-base-100 rounded-box shadow-sm py-12">
          <div className="hero-content text-center">
            <div className="max-w-md">
              <ion-icon name="checkmark-circle-outline" class="text-6xl text-success mb-4"></ion-icon>
              <h1 className="text-2xl font-bold mb-2">All Clear!</h1>
              <p className="opacity-70 mb-4">No tasks in your current sprint. Add some tasks to get started.</p>
              <button onClick={handleOpenCreateTask} className="btn btn-primary gap-2">
                <ion-icon name="add-outline"></ion-icon> Add Task
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveSession = !!activeSession;

  return (
    <div className="p-4 pb-24 max-w-2xl mx-auto space-y-4">
      {/* Hero: Focus on ONE task */}
      <div className="hero bg-base-100 rounded-box shadow-sm py-8">
        <div className="hero-content text-center flex-col">
          <div className="max-w-md">
            <p className="text-sm opacity-60 mb-2">Focus on this now</p>
            <h1 className="text-2xl font-bold mb-4">{focusTask.title}</h1>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {Object.entries(focusTask.tagPoints).map(([tagId, points]) => {
                const tag = getTagById(tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tagId}
                    className="badge badge-lg"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color
                    }}
                  >
                    <span className="mr-1">{tag.icon}</span>
                    <span>{tag.name}</span>
                  </span>
                );
              })}
            </div>
            <div className="flex justify-center gap-2">
              <button
                onClick={handleStartSession}
                disabled={hasActiveSession}
                className="btn btn-primary btn-lg gap-2"
              >
                <ion-icon name="play-outline"></ion-icon> Start Focus
              </button>
              <button
                onClick={handleComplete}
                className="btn btn-success btn-lg gap-2"
              >
                <ion-icon name="checkmark-outline"></ion-icon> Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions for focus task */}
      <div className="flex justify-center gap-2">
        <button
          onClick={() => handleSkipClick('for_now')}
          className="btn btn-ghost btn-sm gap-1"
        >
          <ion-icon name="play-skip-forward-outline"></ion-icon> Skip for now
        </button>
        <button
          onClick={() => handleSkipClick('for_day')}
          className="btn btn-ghost btn-sm gap-1"
        >
          <ion-icon name="calendar-outline"></ion-icon> Skip for day
        </button>
        <button
          onClick={handleOpenTaskDetail}
          className="btn btn-ghost btn-sm gap-1"
        >
          <ion-icon name="create-outline"></ion-icon> Details
        </button>
      </div>

      {/* Up next preview */}
      {upNext.length > 0 && (
        <div className="mt-6">
          <p className="text-sm opacity-60 mb-2 text-center">Up next</p>
          <div className="space-y-2">
            {upNext.slice(0, 3).map((task) => {
              const primaryTag = getTaskPrimaryTag(task);
              return (
                <div key={task.id} className="card bg-base-100 shadow-sm">
                  <div className="card-body p-3 flex-row items-center gap-3">
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{ backgroundColor: primaryTag?.color || '#888' }}
                    />
                    <span className="flex-1 font-medium truncate">{task.title}</span>
                    <button className="btn btn-ghost btn-circle btn-xs">
                      <ion-icon name="chevron-forward-outline"></ion-icon>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skip Modal */}
      <SkipTaskModal
        isOpen={skipModalOpen}
        onClose={() => setSkipModalOpen(false)}
        onSkipped={() => {
          skipCurrentTask(skipType);
          setSkipModalOpen(false);
        }}
        taskId={focusTask.id}
        taskTitle={focusTask.title}
        skipType={skipType}
      />

      {/* End Session Modal */}
      {activeSession && (
        <EndSessionModal
          isOpen={endSessionModalOpen}
          onClose={() => setEndSessionModalOpen(false)}
          onEnded={() => setEndSessionModalOpen(false)}
          taskId={activeSession.taskId}
          sessionId={activeSession.sessionId}
          taskTitle={focusTask.title}
        />
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={taskDetailOpen}
        onClose={() => setTaskDetailOpen(false)}
        task={focusTask ? {
          ...focusTask,
          status: 'active' as const,
          tags: Object.keys(focusTask.tagPoints).map(tagId => {
            const tag = getTagById(tagId);
            return { id: tagId, name: tag?.name || tagId, color: tag?.color || '#888' };
          })
        } : null}
        onStartSession={() => handleStartSession()}
      />
    </div>
  );
}
