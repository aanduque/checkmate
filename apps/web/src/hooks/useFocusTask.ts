/**
 * Focus task hook
 * Provides the current focus task and up-next list
 */

import { useStore, useSelector } from 'statux';
import { useCallback, useEffect, useState } from 'react';
import { FocusTaskDTO, TaskDTO, TagDTO, taskApi, sessionApi, tagApi } from '../services/rpcClient';
import type { AppState } from '../store';

// Environment flag - set to true to use mock data for development
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export function useFocusTask() {
  const [focusTask, setFocusTaskRaw] = useStore<FocusTaskDTO | null>('focusTask');
  const [upNext, setUpNextRaw] = useStore<FocusTaskDTO[]>('upNext');
  const [ui, setUi] = useStore<AppState['ui']>('ui');
  const [tags, setTagsRaw] = useStore<TagDTO[]>('tags');
  const tasks = useSelector<TaskDTO[]>('tasks');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Type-safe setters
  const setFocusTask = (value: FocusTaskDTO | null | ((prev: FocusTaskDTO | null) => FocusTaskDTO | null)) => {
    (setFocusTaskRaw as any)(value);
  };
  const setUpNext = (value: FocusTaskDTO[] | ((prev: FocusTaskDTO[]) => FocusTaskDTO[])) => {
    (setUpNextRaw as any)(value);
  };
  const setTags = (value: TagDTO[] | ((prev: TagDTO[]) => TagDTO[])) => {
    (setTagsRaw as any)(value);
  };

  const loadFocusData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (USE_MOCKS) {
        const { mockFocusTask, mockUpNext, mockTags } = await import('../mocks/mockData');
        setFocusTask(mockFocusTask);
        setUpNext(mockUpNext);
        if (tags.length === 0) {
          setTags(mockTags);
        }
        return { focusTask: mockFocusTask, upNext: mockUpNext };
      }

      // Load tags and focus data in parallel
      const [tagsResult, focusResult] = await Promise.all([
        tags.length === 0 ? tagApi.getAll() : Promise.resolve({ tags }),
        taskApi.getFocus()
      ]);

      if (tagsResult.tags !== tags) {
        setTags(tagsResult.tags);
      }
      setFocusTask(focusResult.focusTask);
      setUpNext(focusResult.upNext);

      return { focusTask: focusResult.focusTask, upNext: focusResult.upNext };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load focus data');
      return { focusTask, upNext };
    } finally {
      setLoading(false);
    }
  }, [focusTask, upNext, tags.length]);

  // Load focus data on mount
  useEffect(() => {
    loadFocusData();
  }, []);

  const startSession = useCallback(async (taskId: string, durationMinutes?: number) => {
    const duration = durationMinutes || 25;

    if (USE_MOCKS) {
      const sessionId = `session-${Date.now()}`;
      setUi(prev => ({
        ...prev,
        activeSession: {
          taskId,
          sessionId,
          startedAt: new Date().toISOString(),
          durationMinutes: duration
        }
      }));
      setFocusTask((prev: FocusTaskDTO | null) => {
        if (prev && prev.id === taskId) {
          return {
            ...prev,
            activeSession: {
              id: sessionId,
              startedAt: new Date(),
              durationMinutes: duration
            }
          };
        }
        return prev;
      });
      return { sessionId, taskId };
    }

    setLoading(true);
    setError(null);
    try {
      const result = await sessionApi.start(taskId, duration);
      setUi(prev => ({
        ...prev,
        activeSession: {
          taskId,
          sessionId: result.sessionId,
          startedAt: new Date().toISOString(),
          durationMinutes: duration
        }
      }));
      setFocusTask((prev: FocusTaskDTO | null) => {
        if (prev && prev.id === taskId) {
          return {
            ...prev,
            activeSession: {
              id: result.sessionId,
              startedAt: new Date(),
              durationMinutes: duration
            }
          };
        }
        return prev;
      });
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUi]);

  const endSession = useCallback(async (
    taskId: string,
    sessionId: string,
    focusLevel: 'distracted' | 'neutral' | 'focused'
  ) => {
    if (USE_MOCKS) {
      setUi(prev => ({
        ...prev,
        activeSession: null,
        sessionElapsed: 0,
        modals: { ...prev.modals, completeSession: false }
      }));
      setFocusTask((prev: FocusTaskDTO | null) => {
        if (prev?.activeSession) {
          return { ...prev, activeSession: undefined };
        }
        return prev;
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sessionApi.end(taskId, sessionId, focusLevel);
      setUi(prev => ({
        ...prev,
        activeSession: null,
        sessionElapsed: 0,
        modals: { ...prev.modals, completeSession: false }
      }));
      setFocusTask((prev: FocusTaskDTO | null) => {
        if (prev?.activeSession) {
          return { ...prev, activeSession: undefined };
        }
        return prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUi]);

  const abandonSession = useCallback(async () => {
    const activeSession = ui.activeSession;
    if (!activeSession) return;

    if (USE_MOCKS) {
      setUi(prev => ({
        ...prev,
        activeSession: null,
        sessionElapsed: 0
      }));
      setFocusTask((prev: FocusTaskDTO | null) => {
        if (prev?.activeSession) {
          return { ...prev, activeSession: undefined };
        }
        return prev;
      });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sessionApi.abandon(activeSession.taskId, activeSession.sessionId);
      setUi(prev => ({
        ...prev,
        activeSession: null,
        sessionElapsed: 0
      }));
      setFocusTask((prev: FocusTaskDTO | null) => {
        if (prev?.activeSession) {
          return { ...prev, activeSession: undefined };
        }
        return prev;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to abandon session');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ui.activeSession, setUi]);

  const completeCurrentTask = useCallback(async () => {
    // Move to next focus task
    setFocusTask((prev: FocusTaskDTO | null) => {
      if (!prev) return prev;
      return upNext.length > 0 ? upNext[0] : null;
    });

    if (upNext.length > 0) {
      setUpNext((prev: FocusTaskDTO[]) => prev.slice(1));
    }

    setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  }, [upNext, setUi]);

  const skipCurrentTask = useCallback(async (
    type: 'for_now' | 'for_day',
    justification?: string
  ) => {
    // Move focus task to end of upNext (for_now) or remove it (for_day)
    setFocusTask((prev: FocusTaskDTO | null) => {
      if (!prev) return prev;
      if (upNext.length > 0) {
        return upNext[0];
      }
      return null;
    });

    setUpNext((prev: FocusTaskDTO[]) => {
      if (type === 'for_now' && focusTask) {
        return [...prev.slice(1), focusTask];
      }
      return prev.slice(1);
    });

    setUi(prev => ({ ...prev, refreshKey: prev.refreshKey + 1 }));
  }, [focusTask, upNext, setUi]);

  // Get tag by ID helper
  const getTagById = useCallback((tagId: string) => {
    return tags.find(t => t.id === tagId);
  }, [tags]);

  return {
    focusTask,
    upNext,
    tags,
    loading,
    error,
    loadFocusData,
    startSession,
    endSession,
    abandonSession,
    completeCurrentTask,
    skipCurrentTask,
    getTagById
  };
}
