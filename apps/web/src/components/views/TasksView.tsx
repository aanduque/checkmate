import React, { useState, useCallback } from 'react';
import { useKanban } from '../../hooks/useKanban';
import { useFocusTask } from '../../hooks/useFocusTask';
import { KanbanBoard } from '../kanban/KanbanBoard';
import { CancelTaskModal } from '../modals/CancelTaskModal';
import { TaskDetailModal } from '../modals/TaskDetailModal';
import type { TaskDTO } from '../../services/rpcClient';
import type { ExtendedTaskDTO } from '../../mocks/mockData';

export function TasksView() {
  const { kanbanData, loading, error, moveTask, loadKanban } = useKanban();
  const { startSession } = useFocusTask();

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [taskToCancel, setTaskToCancel] = useState<TaskDTO | null>(null);

  // Task detail modal state
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<ExtendedTaskDTO | null>(null);

  const handleMoveTask = useCallback((taskId: string, targetColumn: string) => {
    moveTask(taskId, targetColumn);
  }, [moveTask]);

  const handleOpenTaskDetail = useCallback((task: ExtendedTaskDTO) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  }, []);

  const handleCompleteTask = useCallback((_taskId: string) => {
    // TODO: Call RPC to complete task
    loadKanban();
  }, [loadKanban]);

  const handleCancelTask = useCallback((task: TaskDTO) => {
    setTaskToCancel(task);
    setCancelModalOpen(true);
  }, []);

  const handleStartSession = useCallback((taskId: string) => {
    startSession(taskId);
  }, [startSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="alert alert-warning">
          <span>{error}</span>
        </div>
        <button className="btn btn-primary mt-4" onClick={loadKanban}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <KanbanBoard
        kanbanData={kanbanData}
        onMoveTask={handleMoveTask}
        onOpenTaskDetail={handleOpenTaskDetail}
        onCompleteTask={handleCompleteTask}
        onCancelTask={handleCancelTask}
        onStartSession={handleStartSession}
      />

      {/* Cancel Modal */}
      {taskToCancel && (
        <CancelTaskModal
          isOpen={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setTaskToCancel(null);
          }}
          onCanceled={() => {
            loadKanban();
            setTaskToCancel(null);
          }}
          taskId={taskToCancel.id}
          taskTitle={taskToCancel.title}
        />
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        isOpen={taskDetailOpen}
        onClose={() => {
          setTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onUpdated={loadKanban}
        onStartSession={handleStartSession}
      />
    </div>
  );
}
