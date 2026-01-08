import React, { useState } from 'react';
import { useRoutines } from '../../hooks/useRoutines';
import type { RoutineDTO } from '../../store';

interface RoutinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoutinesModal({ isOpen, onClose }: RoutinesModalProps) {
  const { routines, createRoutine, updateRoutine, deleteRoutine } = useRoutines();

  // New routine form state
  const [newRoutineIcon, setNewRoutineIcon] = useState('');
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineColor, setNewRoutineColor] = useState('#6366f1');
  const [newRoutinePriority, setNewRoutinePriority] = useState(5);
  const [newRoutineFilter, setNewRoutineFilter] = useState('');
  const [newRoutineActivation, setNewRoutineActivation] = useState('');

  const handleUpdateRoutine = (routine: RoutineDTO, updates: Partial<RoutineDTO>) => {
    updateRoutine(routine.id, { ...routine, ...updates });
  };

  const handleAddRoutine = async () => {
    if (!newRoutineName.trim()) return;

    await createRoutine({
      name: newRoutineName.trim(),
      icon: newRoutineIcon || '📋',
      color: newRoutineColor,
      priority: newRoutinePriority,
      taskFilterExpression: newRoutineFilter || 'true',
      activationExpression: newRoutineActivation || 'true'
    });

    // Reset form
    setNewRoutineIcon('');
    setNewRoutineName('');
    setNewRoutineColor('#6366f1');
    setNewRoutinePriority(5);
    setNewRoutineFilter('');
    setNewRoutineActivation('');
  };

  const handleDeleteRoutine = (routine: RoutineDTO) => {
    if (confirm(`Delete routine "${routine.name}"?`)) {
      deleteRoutine(routine.id);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-2xl max-h-[90vh]">
        {/* Close Button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold mb-2">Manage Routines</h3>
        <p className="text-sm opacity-70 mb-4">
          Routines auto-filter tasks based on time. Higher priority wins when multiple match.
        </p>

        {/* Existing Routines */}
        <div className="space-y-3 mb-6">
          {routines.map(routine => (
            <div key={routine.id} className="p-4 bg-base-200 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={routine.icon}
                      onChange={(e) => handleUpdateRoutine(routine, { icon: e.target.value })}
                      className="input input-ghost w-10 text-center p-0"
                    />
                    <input
                      type="text"
                      value={routine.name}
                      onChange={(e) => handleUpdateRoutine(routine, { name: e.target.value })}
                      className="input input-ghost font-medium p-0 h-auto"
                      style={{ color: routine.color }}
                    />
                    <span className="text-xs opacity-60">Priority:</span>
                    <input
                      type="number"
                      value={routine.priority}
                      onChange={(e) => handleUpdateRoutine(routine, { priority: parseInt(e.target.value) || 1 })}
                      min={1}
                      max={10}
                      className="input input-bordered input-xs w-14"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="form-control">
                      <label className="label py-0">
                        <span className="label-text-alt">Task Filter</span>
                      </label>
                      <input
                        type="text"
                        value={routine.taskFilterExpression}
                        onChange={(e) => handleUpdateRoutine(routine, { taskFilterExpression: e.target.value })}
                        className="input input-bordered input-sm"
                        placeholder="hasTag('work')"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label py-0">
                        <span className="label-text-alt">Activation</span>
                      </label>
                      <input
                        type="text"
                        value={routine.activationExpression}
                        onChange={(e) => handleUpdateRoutine(routine, { activationExpression: e.target.value })}
                        className="input input-bordered input-sm"
                        placeholder="isWeekday"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={routine.color}
                    onChange={(e) => handleUpdateRoutine(routine, { color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <button
                    onClick={() => handleDeleteRoutine(routine)}
                    className="btn btn-ghost btn-sm text-error"
                  >
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {routines.length === 0 && (
            <p className="text-center opacity-50 py-4">No routines yet</p>
          )}
        </div>

        <div className="divider"></div>

        {/* Add New Routine */}
        <h4 className="font-medium mb-3">Add New Routine</h4>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newRoutineIcon}
              onChange={(e) => setNewRoutineIcon(e.target.value)}
              className="input input-bordered w-12 text-center"
              placeholder="🏠"
            />
            <input
              type="text"
              value={newRoutineName}
              onChange={(e) => setNewRoutineName(e.target.value)}
              className="input input-bordered flex-1"
              placeholder="Routine name"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newRoutineColor}
              onChange={(e) => setNewRoutineColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
            />
            <input
              type="number"
              value={newRoutinePriority}
              onChange={(e) => setNewRoutinePriority(parseInt(e.target.value) || 5)}
              min={1}
              max={10}
              className="input input-bordered w-16"
              placeholder="Pri"
            />
          </div>
          <input
            type="text"
            value={newRoutineFilter}
            onChange={(e) => setNewRoutineFilter(e.target.value)}
            className="input input-bordered"
            placeholder="Task filter (e.g., hasTag('work'))"
          />
          <input
            type="text"
            value={newRoutineActivation}
            onChange={(e) => setNewRoutineActivation(e.target.value)}
            className="input input-bordered"
            placeholder="Activation (e.g., isWeekday)"
          />
        </div>
        <div className="flex justify-end mb-4">
          <button
            onClick={handleAddRoutine}
            disabled={!newRoutineName.trim()}
            className="btn btn-primary"
          >
            Add Routine
          </button>
        </div>

        {/* Help Info */}
        <div className="alert alert-info">
          <div>
            <p className="font-medium mb-1">Expression Examples:</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div>hasTag("Work")</div>
              <div>isWeekday and hour &gt;= 9</div>
              <div>age &gt; 7</div>
              <div>dayOfWeek == "mon"</div>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
