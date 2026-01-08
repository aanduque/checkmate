import React, { useState, useEffect } from 'react';
import { taskApi, TaskDTO } from '../../services/rpcClient';
import { KanbanBoard } from '../kanban/KanbanBoard';
import { CancelTaskModal } from '../modals/CancelTaskModal';

export function TasksView() {
  const [backlog, setBacklog] = useState<TaskDTO[]>([]);
  const [sprint, setSprint] = useState<TaskDTO[]>([]);
  const [completed, setCompleted] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancel modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [taskToCancel, setTaskToCancel] = useState<TaskDTO | null>(null);

  useEffect(() => {
    loadKanban();
  }, []);

  const loadKanban = async () => {
    try {
      setLoading(true);
      const data = await taskApi.getKanban();
      setBacklog(data.backlog);
      setSprint(data.sprint);
      setCompleted(data.completed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskAction = async (taskId: string, action: 'complete' | 'cancel') => {
    if (action === 'cancel') {
      // Find the task to show in modal
      const task = [...backlog, ...sprint, ...completed].find(t => t.id === taskId);
      if (task) {
        setTaskToCancel(task);
        setCancelModalOpen(true);
      }
      return;
    }

    try {
      await taskApi.complete(taskId);
      loadKanban();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    }
  };

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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      <KanbanBoard
        backlog={backlog}
        sprint={sprint}
        completed={completed}
        onTaskAction={handleTaskAction}
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
    </div>
  );
}
