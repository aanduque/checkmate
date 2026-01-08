import React, { useState } from 'react';
import { useStore } from 'statux';
import { useRoutines } from '../../hooks/useRoutines';

const DEFAULT_ICONS = ['🌅', '☀️', '🌆', '🌙', '💼', '🏠', '🎯', '📚', '🏃', '🧘'];
const DEFAULT_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
];

export function RoutinesModal() {
  const [isOpen, setIsOpen] = useStore<boolean>('ui.modals.routines');
  const { routines, createRoutine, updateRoutine, deleteRoutine } = useRoutines();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(DEFAULT_ICONS[0]);
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [filter, setFilter] = useState('');
  const [timeRanges, setTimeRanges] = useState<Array<{ start: string; end: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setIcon(DEFAULT_ICONS[0]);
    setColor(DEFAULT_COLORS[0]);
    setFilter('');
    setTimeRanges([]);
    setShowForm(false);
  };

  const handleEdit = (routine: any) => {
    setEditingId(routine.id);
    setName(routine.name);
    setIcon(routine.icon);
    setColor(routine.color);
    setFilter(routine.filter || '');
    setTimeRanges(routine.timeRanges || []);
    setShowForm(true);
  };

  const handleAddTimeRange = () => {
    setTimeRanges([...timeRanges, { start: '09:00', end: '17:00' }]);
  };

  const handleRemoveTimeRange = (index: number) => {
    setTimeRanges(timeRanges.filter((_, i) => i !== index));
  };

  const handleTimeRangeChange = (
    index: number,
    field: 'start' | 'end',
    value: string
  ) => {
    const newRanges = [...timeRanges];
    newRanges[index] = { ...newRanges[index], [field]: value };
    setTimeRanges(newRanges);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        icon,
        color,
        filter: filter.trim() || undefined,
        timeRanges: timeRanges.length > 0 ? timeRanges : undefined,
      };

      if (editingId) {
        await updateRoutine(editingId, data);
      } else {
        await createRoutine(data);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save routine:', error);
      alert('Failed to save routine');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (routineId: string) => {
    if (!confirm('Are you sure you want to delete this routine?')) {
      return;
    }
    try {
      await deleteRoutine(routineId);
    } catch (error) {
      console.error('Failed to delete routine:', error);
      alert('Failed to delete routine');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Manage Routines</h3>
          <button onClick={handleClose} className="btn btn-ghost btn-sm btn-square">
            <ion-icon name="close-outline" class="text-xl"></ion-icon>
          </button>
        </div>

        {/* Routine List */}
        <div className="space-y-2 mb-4">
          {routines.map((routine: any) => (
            <div
              key={routine.id}
              className="flex items-center gap-3 p-3 bg-base-200 rounded-lg"
            >
              <span className="text-2xl">{routine.icon}</span>
              <div className="flex-1">
                <p className="font-medium" style={{ color: routine.color }}>
                  {routine.name}
                </p>
                {routine.timeRanges && routine.timeRanges.length > 0 && (
                  <p className="text-xs text-base-content/60">
                    {routine.timeRanges.map((r: any) => `${r.start}-${r.end}`).join(', ')}
                  </p>
                )}
                {routine.filter && (
                  <p className="text-xs text-base-content/40 font-mono">{routine.filter}</p>
                )}
              </div>
              <button
                onClick={() => handleEdit(routine)}
                className="btn btn-ghost btn-sm btn-square"
              >
                <ion-icon name="create-outline"></ion-icon>
              </button>
              <button
                onClick={() => handleDelete(routine.id)}
                className="btn btn-ghost btn-sm btn-square text-error"
              >
                <ion-icon name="trash-outline"></ion-icon>
              </button>
            </div>
          ))}
          {routines.length === 0 && (
            <p className="text-center text-base-content/60 py-4">
              No routines yet. Create one to organize your tasks by time of day.
            </p>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm ? (
          <form onSubmit={handleSubmit} className="bg-base-200 rounded-lg p-4">
            <h4 className="font-medium mb-3">
              {editingId ? 'Edit Routine' : 'New Routine'}
            </h4>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Routine name"
                className="input input-bordered w-full"
                autoFocus
              />
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Icon</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={`w-10 h-10 rounded-lg text-xl transition-all ${
                      icon === i
                        ? 'bg-primary/20 ring-2 ring-primary scale-110'
                        : 'bg-base-100 hover:bg-base-300'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Color</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-transform ${
                      color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  ></button>
                ))}
              </div>
            </div>

            <div className="form-control mb-3">
              <label className="label">
                <span className="label-text">Time Ranges (optional)</span>
                <button
                  type="button"
                  onClick={handleAddTimeRange}
                  className="btn btn-ghost btn-xs"
                >
                  <ion-icon name="add-outline"></ion-icon>
                  Add
                </button>
              </label>
              {timeRanges.map((range, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="time"
                    value={range.start}
                    onChange={(e) => handleTimeRangeChange(index, 'start', e.target.value)}
                    className="input input-bordered input-sm"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={range.end}
                    onChange={(e) => handleTimeRangeChange(index, 'end', e.target.value)}
                    className="input input-bordered input-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTimeRange(index)}
                    className="btn btn-ghost btn-sm btn-square"
                  >
                    <ion-icon name="close-outline"></ion-icon>
                  </button>
                </div>
              ))}
              {timeRanges.length === 0 && (
                <p className="text-sm text-base-content/60">
                  No time ranges - routine must be manually selected
                </p>
              )}
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Filter Expression (optional)</span>
              </label>
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder='e.g., "Work" in tags or points > 3'
                className="input input-bordered w-full font-mono text-sm"
              />
              <label className="label">
                <span className="label-text-alt">
                  Use Filtrex syntax to filter tasks by tags or points
                </span>
              </label>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={resetForm} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || submitting}
                className="btn btn-primary flex-1"
              >
                {submitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : editingId ? (
                  'Update'
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary w-full"
          >
            <ion-icon name="add-outline"></ion-icon>
            Add Routine
          </button>
        )}
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
