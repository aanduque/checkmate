import { useStore } from 'statux';
import { useCallback } from 'react';
import { api } from '../services/rpcClient';
import type { Task } from '../store';

export function useTasks() {
  const [tasks, setTasks] = useStore<Task[]>('tasks');

  const refreshTasks = useCallback(async () => {
    const result = await api.tasks.getAll();
    setTasks(result.tasks);
  }, [setTasks]);

  const createTask = useCallback(
    async (params: {
      title: string;
      description?: string;
      tagPoints: Record<string, number>;
      sprintId?: string;
      recurrence?: string;
    }) => {
      const result = await api.tasks.create(params);
      setTasks((prev: Task[]) => [...prev, result.task]);
      return result.task;
    },
    [setTasks]
  );

  const updateTask = useCallback(
    async (taskId: string, params: { title?: string; tagPoints?: Record<string, number> }) => {
      const result = await api.tasks.update(taskId, params);
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const completeTask = useCallback(
    async (taskId: string) => {
      const result = await api.tasks.complete(taskId);
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const cancelTask = useCallback(
    async (taskId: string) => {
      const result = await api.tasks.cancel(taskId);
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const moveTask = useCallback(
    async (taskId: string, sprintId: string | null) => {
      let result;
      if (sprintId) {
        result = await api.tasks.moveToSprint(taskId, sprintId);
      } else {
        result = await api.tasks.moveToBacklog(taskId);
      }
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const moveToSprint = useCallback(
    async (taskId: string, sprintId: string) => {
      const result = await api.tasks.moveToSprint(taskId, sprintId);
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const moveToBacklog = useCallback(
    async (taskId: string) => {
      const result = await api.tasks.moveToBacklog(taskId);
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const skipTaskForNow = useCallback(
    async (taskId: string) => {
      const result = await api.tasks.skipForNow(taskId);
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const skipTaskForDay = useCallback(
    async (taskId: string, justification: string) => {
      const result = await api.tasks.skipForDay(taskId, justification);
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const clearSkipState = useCallback(
    async (taskId: string) => {
      const result = await api.tasks.clearSkipState(taskId);
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const addComment = useCallback(
    async (taskId: string, content: string) => {
      const result = await api.tasks.addComment(taskId, content);
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const deleteComment = useCallback(
    async (taskId: string, commentId: string) => {
      const result = await api.tasks.deleteComment(taskId, commentId);
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const addManualSession = useCallback(
    async (
      taskId: string,
      durationMinutes: number,
      focusLevel: string,
      note?: string,
      date?: string
    ) => {
      const result = await api.tasks.addManualSession(
        taskId,
        durationMinutes,
        focusLevel,
        note,
        date
      );
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      return result.task;
    },
    [setTasks]
  );

  const spawnInstance = useCallback(
    async (templateId: string) => {
      const result = await api.tasks.spawnInstance(templateId);
      setTasks((prev: Task[]) => [...prev, result.task]);
      return result.task;
    },
    [setTasks]
  );

  const getTaskById = useCallback(
    (taskId: string) => tasks.find((t) => t.id === taskId),
    [tasks]
  );

  const backlogTasks = tasks.filter(
    (t) =>
      t.location.type === 'backlog' && t.status === 'active' && !t.recurrence
  );

  const recurringTemplates = tasks.filter(
    (t) => t.recurrence && t.status === 'active'
  );

  const completedTasks = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'canceled'
  );

  return {
    tasks,
    backlogTasks,
    recurringTemplates,
    completedTasks,
    refreshTasks,
    createTask,
    updateTask,
    completeTask,
    cancelTask,
    moveTask,
    moveToSprint,
    moveToBacklog,
    skipTaskForNow,
    skipTaskForDay,
    clearSkipState,
    addComment,
    deleteComment,
    addManualSession,
    spawnInstance,
    getTaskById,
  };
}
