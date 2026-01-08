/**
 * Task management hook
 * Provides CRUD operations for tasks via RPC (mocked until backend ready)
 */

import { useStore } from 'statux';
import { useCallback, useEffect } from 'react';
import { TaskDTO } from '../services/rpcClient';
import { mockTasks, mockExtendedTasks, ExtendedTaskDTO } from '../mocks/mockData';
import type { AppState } from '../store';

// Flag to use mock data (switch to false when backend is ready)
const USE_MOCKS = true;

export function useTasks() {
  const [tasks, setTasks] = useStore<TaskDTO[]>('tasks');
  const [ui, setUi] = useStore<AppState['ui']>('ui');

  // Load tasks on mount
  useEffect(() => {
    if (USE_MOCKS && tasks.length === 0) {
      setTasks(mockTasks);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    if (USE_MOCKS) {
      setTasks(mockTasks);
      return mockTasks;
    }
    // TODO: Call RPC when backend ready
    // const result = await taskApi.getAll();
    // setTasks(result.tasks);
    // return result.tasks;
    return tasks;
  }, [setTasks, tasks]);

  const createTask = useCallback(async (params: {
    title: string;
    description?: string;
    tagPoints: Record<string, number>;
    sprintId?: string;
  }) => {
    const newTask: TaskDTO = {
      id: `task-${Date.now()}`,
      title: params.title,
      status: 'active',
      tagPoints: params.tagPoints,
      totalPoints: Object.values(params.tagPoints).reduce((a, b) => a + b, 0),
      tags: [] // Would be populated from tagPoints mapping
    };

    setTasks(prev => [...prev, newTask]);
    setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));

    return newTask;
  }, [setTasks, setUi]);

  const completeTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'completed' as const } : t
    ));
    setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  }, [setTasks, setUi]);

  const cancelTask = useCallback(async (taskId: string, justification: string) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: 'canceled' as const } : t
    ));
    setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  }, [setTasks, setUi]);

  const skipTask = useCallback(async (
    taskId: string,
    type: 'for_now' | 'for_day',
    justification?: string
  ) => {
    // In a real implementation, this would update the task's skipState
    setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  }, [setUi]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<TaskDTO>) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ));
    setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  }, [setTasks, setUi]);

  const getTaskById = useCallback((taskId: string) => {
    return tasks.find(t => t.id === taskId);
  }, [tasks]);

  const getActiveTasks = useCallback(() => {
    return tasks.filter(t => t.status === 'active');
  }, [tasks]);

  return {
    tasks,
    loadTasks,
    createTask,
    completeTask,
    cancelTask,
    skipTask,
    updateTask,
    getTaskById,
    getActiveTasks
  };
}
