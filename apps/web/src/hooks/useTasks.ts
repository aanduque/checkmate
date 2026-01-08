/**
 * Task management hook
 * Provides CRUD operations for tasks via RPC
 */

import { useStore } from 'statux';
import { useCallback, useEffect, useState } from 'react';
import { TaskDTO, taskApi } from '../services/rpcClient';
import type { AppState } from '../store';

export function useTasks() {
  const [tasks, setTasks] = useStore<TaskDTO[]>('tasks');
  const [ui, setUi] = useStore<AppState['ui']>('ui');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await taskApi.getKanban();
      // Combine all tasks from kanban
      const allTasks = [...result.backlog, ...result.sprint, ...result.completed];
      setTasks(allTasks);
      return allTasks;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      return tasks;
    } finally {
      setLoading(false);
    }
  }, [setTasks, tasks]);

  // Load tasks on mount
  useEffect(() => {
    if (tasks.length === 0) {
      loadTasks();
    }
  }, []);

  const createTask = useCallback(async (params: {
    title: string;
    description?: string;
    tagPoints: Record<string, number>;
    sprintId?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await taskApi.create(params);
      // Refresh tasks after creation
      await loadTasks();
      setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setTasks, setUi, loadTasks]);

  const completeTask = useCallback(async (taskId: string) => {
    setLoading(true);
    setError(null);
    try {
      await taskApi.complete(taskId);
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'completed' as const } : t
      ));
      setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setTasks, setUi]);

  const cancelTask = useCallback(async (taskId: string, justification: string) => {
    setLoading(true);
    setError(null);
    try {
      await taskApi.cancel(taskId, justification);
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: 'canceled' as const } : t
      ));
      setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setTasks, setUi]);

  const skipTask = useCallback(async (
    taskId: string,
    type: 'for_now' | 'for_day',
    justification?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      await taskApi.skip(taskId, type, justification);
      setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUi]);

  const updateTask = useCallback(async (
    taskId: string,
    updates: { title?: string; description?: string; tagPoints?: Record<string, number> }
  ) => {
    setLoading(true);
    setError(null);
    try {
      await taskApi.update(taskId, updates);
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, ...updates } : t
      ));
      setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setTasks, setUi]);

  const moveTask = useCallback(async (taskId: string, sprintId?: string) => {
    setLoading(true);
    setError(null);
    try {
      await taskApi.move(taskId, sprintId);
      await loadTasks();
      setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to move task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUi, loadTasks]);

  const getTaskById = useCallback((taskId: string) => {
    return tasks.find(t => t.id === taskId);
  }, [tasks]);

  const getActiveTasks = useCallback(() => {
    return tasks.filter(t => t.status === 'active');
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    completeTask,
    cancelTask,
    skipTask,
    updateTask,
    moveTask,
    getTaskById,
    getActiveTasks
  };
}
