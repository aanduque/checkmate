import React, { useState } from 'react';
import { useStore } from 'statux';
import { useTasks } from '../../hooks/useTasks';
import { useSprints } from '../../hooks/useSprints';

const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21];

export function CreateTaskModal() {
  const [isOpen, setIsOpen] = useStore<boolean>('ui.modals.createTask');
  const [tags] = useStore<any[]>('tags');
  const [sprints] = useStore<any[]>('sprints');
  const { createTask } = useTasks();
  const { getCurrentSprint, getNextSprint } = useSprints();

  const [title, setTitle] = useState('');
  const [tagPoints, setTagPoints] = useState<Record<string, number>>({});
  const [sprintId, setSprintId] = useState<string>('');
  const [recurrence, setRecurrence] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentSprint = getCurrentSprint();
  const nextSprint = getNextSprint();

  const handleClose = () => {
    setIsOpen(false);
    setTitle('');
    setTagPoints({});
    setSprintId('');
    setRecurrence('');
  };

  const handleTagPointChange = (tagId: string, points: number) => {
    if (points === 0) {
      const newTagPoints = { ...tagPoints };
      delete newTagPoints[tagId];
      setTagPoints(newTagPoints);
    } else {
      setTagPoints({ ...tagPoints, [tagId]: points });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || Object.keys(tagPoints).length === 0) return;

    setSubmitting(true);
    try {
      await createTask({
        title: title.trim(),
        tagPoints,
        sprintId: sprintId || undefined,
        recurrence: recurrence || undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Create New Task</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Title</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="input input-bordered w-full"
              autoFocus
            />
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Tag Points</span>
              <span className="label-text-alt">Select at least one tag</span>
            </label>
            <div className="space-y-2">
              {tags.map((tag: any) => (
                <div key={tag.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  ></div>
                  <span className="flex-1 text-sm">{tag.name}</span>
                  <select
                    value={tagPoints[tag.id] || 0}
                    onChange={(e) => handleTagPointChange(tag.id, parseInt(e.target.value))}
                    className="select select-bordered select-sm"
                  >
                    <option value={0}>-</option>
                    {FIBONACCI_POINTS.map((p) => (
                      <option key={p} value={p}>
                        {p} pts
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-base-content/60">
                  No tags available. Create some tags first.
                </p>
              )}
            </div>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Sprint (optional)</span>
            </label>
            <select
              value={sprintId}
              onChange={(e) => setSprintId(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="">Backlog</option>
              {currentSprint && (
                <option value={currentSprint.id}>This Week (Current Sprint)</option>
              )}
              {nextSprint && (
                <option value={nextSprint.id}>Next Week</option>
              )}
            </select>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Recurrence (optional)</span>
              <span className="label-text-alt">RRULE format</span>
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="select select-bordered w-full"
            >
              <option value="">No recurrence</option>
              <option value="FREQ=DAILY">Daily</option>
              <option value="FREQ=WEEKLY">Weekly</option>
              <option value="FREQ=WEEKLY;BYDAY=MO,WE,FR">Mon, Wed, Fri</option>
              <option value="FREQ=WEEKLY;BYDAY=TU,TH">Tue, Thu</option>
              <option value="FREQ=MONTHLY">Monthly</option>
            </select>
          </div>

          <div className="modal-action">
            <button type="button" onClick={handleClose} className="btn btn-ghost">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || Object.keys(tagPoints).length === 0 || submitting}
              className="btn btn-primary"
            >
              {submitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
