import { useStore } from 'statux';
import { useCallback, useEffect, useRef } from 'react';
import { api } from '../services/rpcClient';
import type { Task, ActiveSession } from '../store';

export function useSessions() {
  const [tasks, setTasks] = useStore<Task[]>('tasks');
  const [activeSession, setActiveSession] = useStore<ActiveSession | null>(
    'ui.activeSession'
  );
  const [sessionElapsed, setSessionElapsed] = useStore<number>(
    'ui.sessionElapsed'
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer effect
  useEffect(() => {
    if (activeSession) {
      intervalRef.current = setInterval(() => {
        setSessionElapsed((prev: number) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeSession, setSessionElapsed]);

  const startSession = useCallback(
    async (taskId: string) => {
      const result = await api.tasks.startSession(taskId);
      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === taskId ? result.task : t))
      );
      setActiveSession((() => ({
        taskId,
        sessionId: result.sessionId,
        startedAt: new Date().toISOString(),
      })) as any);
      setSessionElapsed(0 as any);
      return result;
    },
    [setTasks, setActiveSession, setSessionElapsed]
  );

  const completeSession = useCallback(
    async (focusLevel: string, completeTask?: boolean) => {
      if (!activeSession) return null;

      const result = await api.tasks.completeSession(
        activeSession.taskId,
        activeSession.sessionId,
        focusLevel
      );

      setTasks((prev: Task[]) =>
        prev.map((t) => (t.id === activeSession.taskId ? result.task : t))
      );

      // If user wants to complete the task as well
      if (completeTask) {
        const taskResult = await api.tasks.complete(activeSession.taskId);
        setTasks((prev: Task[]) =>
          prev.map((t) => (t.id === activeSession.taskId ? taskResult.task : t))
        );
      }

      setActiveSession((() => null) as any);
      setSessionElapsed(0 as any);

      return result.task;
    },
    [activeSession, setTasks, setActiveSession, setSessionElapsed]
  );

  const abandonSession = useCallback(async () => {
    if (!activeSession) return null;

    const result = await api.tasks.abandonSession(
      activeSession.taskId,
      activeSession.sessionId
    );

    setTasks((prev: Task[]) =>
      prev.map((t) => (t.id === activeSession.taskId ? result.task : t))
    );
    setActiveSession((() => null) as any);
    setSessionElapsed(0 as any);

    return result.task;
  }, [activeSession, setTasks, setActiveSession, setSessionElapsed]);

  const formatSessionTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getActiveTask = useCallback(() => {
    if (!activeSession) return null;
    return tasks.find((t) => t.id === activeSession.taskId) || null;
  }, [activeSession, tasks]);

  return {
    activeSession,
    sessionElapsed,
    startSession,
    completeSession,
    abandonSession,
    formatSessionTime,
    getActiveTask,
  };
}
