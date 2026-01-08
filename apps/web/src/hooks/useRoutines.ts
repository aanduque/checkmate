/**
 * Routines management hook
 */

import { useStore } from 'statux';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RoutineDTO, routineApi } from '../services/rpcClient';
import type { AppState } from '../store';

// Environment flag - set to true to use mock data for development
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export function useRoutines() {
  const [routines, setRoutines] = useStore<RoutineDTO[]>('routines');
  const [ui, setUi] = useStore<AppState['ui']>('ui');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoutines = useCallback(async () => {
    if (USE_MOCKS) {
      const { mockRoutines } = await import('../mocks/mockData');
      setRoutines(mockRoutines);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await routineApi.getAll();
      setRoutines(result.routines);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load routines');
    } finally {
      setLoading(false);
    }
  }, [setRoutines]);

  // Load routines on mount
  useEffect(() => {
    if (routines.length === 0) {
      loadRoutines();
    }
  }, []);

  // Determine active routine based on time or manual override
  const activeRoutine = useMemo(() => {
    // Planning mode
    if (ui.manualRoutineId === '__planning__') {
      return {
        id: '__planning__',
        name: 'Planning',
        icon: '📋',
        color: '#6366f1',
        priority: 100,
        taskFilterExpression: 'true', // Show all
        activationExpression: 'false'
      } as RoutineDTO;
    }

    // Manual override
    if (ui.manualRoutineId) {
      return routines.find(r => r.id === ui.manualRoutineId) || null;
    }

    // Auto-select based on time (simplified)
    const now = new Date();
    const hour = now.getHours();
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    // Simple logic: Work during weekday business hours, Personal otherwise
    if (!isWeekend && hour >= 9 && hour < 18) {
      return routines.find(r => r.name === 'Work') || routines[0] || null;
    }

    return routines.find(r => r.name === 'Personal') || routines[0] || null;
  }, [routines, ui.manualRoutineId]);

  const setManualRoutine = useCallback((routineId: string | null) => {
    setUi(prev => ({
      ...prev,
      manualRoutineId: routineId
    }));
  }, [setUi]);

  const enterPlanningMode = useCallback(() => {
    setUi(prev => ({
      ...prev,
      manualRoutineId: '__planning__'
    }));
  }, [setUi]);

  const exitPlanningMode = useCallback(() => {
    setUi(prev => ({
      ...prev,
      manualRoutineId: null
    }));
  }, [setUi]);

  const createRoutine = useCallback(async (params: Omit<RoutineDTO, 'id'>) => {
    if (USE_MOCKS) {
      const newRoutine: RoutineDTO = {
        ...params,
        id: `routine-${Date.now()}`
      };
      setRoutines(prev => [...prev, newRoutine]);
      return newRoutine;
    }

    setLoading(true);
    setError(null);
    try {
      const newRoutine = await routineApi.create(params);
      setRoutines(prev => [...prev, newRoutine]);
      return newRoutine;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create routine');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setRoutines]);

  const updateRoutine = useCallback(async (routineId: string, updates: Partial<RoutineDTO>) => {
    if (USE_MOCKS) {
      setRoutines(prev => prev.map(r =>
        r.id === routineId ? { ...r, ...updates } : r
      ));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await routineApi.update(routineId, updates);
      setRoutines(prev => prev.map(r =>
        r.id === routineId ? { ...r, ...updates } : r
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update routine');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setRoutines]);

  const deleteRoutine = useCallback(async (routineId: string) => {
    if (USE_MOCKS) {
      setRoutines(prev => prev.filter(r => r.id !== routineId));
      if (ui.manualRoutineId === routineId) {
        setUi(prev => ({ ...prev, manualRoutineId: null }));
      }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await routineApi.delete(routineId);
      setRoutines(prev => prev.filter(r => r.id !== routineId));
      if (ui.manualRoutineId === routineId) {
        setUi(prev => ({ ...prev, manualRoutineId: null }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete routine');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setRoutines, ui.manualRoutineId, setUi]);

  const isInPlanningMode = ui.manualRoutineId === '__planning__';

  return {
    routines,
    activeRoutine,
    isInPlanningMode,
    loading,
    error,
    loadRoutines,
    setManualRoutine,
    enterPlanningMode,
    exitPlanningMode,
    createRoutine,
    updateRoutine,
    deleteRoutine
  };
}
