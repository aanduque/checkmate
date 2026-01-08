/**
 * Focus task hook
 * Provides the current focus task and up-next list
 */

import { useStore, useSelector } from 'statux';
import { useCallback, useEffect } from 'react';
import { FocusTaskDTO, TaskDTO, TagDTO } from '../services/rpcClient';
import { mockFocusTask, mockUpNext, mockTags } from '../mocks/mockData';
import type { AppState } from '../store';

// Flag to use mock data
const USE_MOCKS = true;

export function useFocusTask() {
  // Note: statux typing requires workarounds for nullable values
  const [focusTask, setFocusTaskRaw] = useStore<FocusTaskDTO | null>('focusTask');
  const [upNext, setUpNextRaw] = useStore<FocusTaskDTO[]>('upNext');
  const [ui, setUi] = useStore<AppState['ui']>('ui');
  const [tags, setTagsRaw] = useStore<TagDTO[]>('tags');
  const tasks = useSelector<TaskDTO[]>('tasks');

  // Type-safe setters that work around statux typing quirks
  const setFocusTask = (value: FocusTaskDTO | null | ((prev: FocusTaskDTO | null) => FocusTaskDTO | null)) => {
    (setFocusTaskRaw as any)(value);
  };
  const setUpNext = (value: FocusTaskDTO[] | ((prev: FocusTaskDTO[]) => FocusTaskDTO[])) => {
    (setUpNextRaw as any)(value);
  };
  const setTags = (value: TagDTO[] | ((prev: TagDTO[]) => TagDTO[])) => {
    (setTagsRaw as any)(value);
  };

  // Load focus data on mount
  useEffect(() => {
    if (USE_MOCKS) {
      setFocusTask(mockFocusTask);
      setUpNext(mockUpNext);
      if (tags.length === 0) {
        setTags(mockTags);
      }
    }
  }, []);

  const loadFocusData = useCallback(async () => {
    if (USE_MOCKS) {
      setFocusTask(mockFocusTask);
      setUpNext(mockUpNext);
      return { focusTask: mockFocusTask, upNext: mockUpNext };
    }
    // TODO: Call RPC when backend ready
    return { focusTask, upNext };
  }, [focusTask, upNext]);

  const startSession = useCallback(async (taskId: string, durationMinutes?: number) => {
    const sessionId = `session-${Date.now()}`;
    const duration = durationMinutes || 25;

    setUi(prev => ({
      ...prev,
      activeSession: {
        taskId,
        sessionId,
        startedAt: new Date().toISOString(),
        durationMinutes: duration
      }
    }));

    // Update focus task to show active session
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
  }, [setUi]);

  const endSession = useCallback(async (
    taskId: string,
    sessionId: string,
    focusLevel: 'distracted' | 'neutral' | 'focused'
  ) => {
    setUi(prev => ({
      ...prev,
      activeSession: null,
      sessionElapsed: 0,
      modals: { ...prev.modals, completeSession: false }
    }));

    // Clear active session from focus task
    setFocusTask((prev: FocusTaskDTO | null) => {
      if (prev?.activeSession) {
        return { ...prev, activeSession: undefined };
      }
      return prev;
    });
  }, [setUi]);

  const abandonSession = useCallback(async () => {
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
  }, [setUi]);

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
    loadFocusData,
    startSession,
    endSession,
    abandonSession,
    completeCurrentTask,
    skipCurrentTask,
    getTagById
  };
}
