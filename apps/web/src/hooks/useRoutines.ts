/**
 * Routines management hook
 */

import { useStore } from 'statux';
import { useCallback, useEffect, useMemo } from 'react';
import { mockRoutines } from '../mocks/mockData';
import type { RoutineDTO, AppState } from '../store';

// Flag to use mock data
const USE_MOCKS = true;

export function useRoutines() {
  const [routines, setRoutines] = useStore<RoutineDTO[]>('routines');
  const [ui, setUi] = useStore<AppState['ui']>('ui');

  // Load routines on mount
  useEffect(() => {
    if (USE_MOCKS && routines.length === 0) {
      setRoutines(mockRoutines);
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
    const newRoutine: RoutineDTO = {
      ...params,
      id: `routine-${Date.now()}`
    };

    setRoutines(prev => [...prev, newRoutine]);
    return newRoutine;
  }, [setRoutines]);

  const updateRoutine = useCallback(async (routineId: string, updates: Partial<RoutineDTO>) => {
    setRoutines(prev => prev.map(r =>
      r.id === routineId ? { ...r, ...updates } : r
    ));
  }, [setRoutines]);

  const deleteRoutine = useCallback(async (routineId: string) => {
    setRoutines(prev => prev.filter(r => r.id !== routineId));

    // Clear manual selection if deleted routine was selected
    if (ui.manualRoutineId === routineId) {
      setUi(prev => ({
        ...prev,
        manualRoutineId: null
      }));
    }
  }, [setRoutines, ui.manualRoutineId, setUi]);

  const isInPlanningMode = ui.manualRoutineId === '__planning__';

  return {
    routines,
    activeRoutine,
    isInPlanningMode,
    setManualRoutine,
    enterPlanningMode,
    exitPlanningMode,
    createRoutine,
    updateRoutine,
    deleteRoutine
  };
}
