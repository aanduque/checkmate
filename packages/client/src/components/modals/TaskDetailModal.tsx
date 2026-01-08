import React, { useState, useEffect } from 'react';
import { useStore } from 'statux';
import { useTasks } from '../../hooks/useTasks';
import { useSessions } from '../../hooks/useSessions';
import { useSprints } from '../../hooks/useSprints';
import { formatDate, formatTime } from '../../utils/dateUtils';

const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21];

export function TaskDetailModal() {
  const [isOpen, setIsOpen] = useStore<boolean>('ui.modals.taskDetail');
  const [selectedTaskId] = useStore<string>('ui.selectedTaskId');
  const [tasks] = useStore<any[]>('tasks');
  const [tags] = useStore<any[]>('tags');
  const { updateTask, completeTask, cancelTask, moveTask, addComment } = useTasks();
  const { startSession } = useSessions();
  const { getCurrentSprint, getNextSprint } = useSprints();

  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState('');
  const [tagPoints, setTagPoints] = useState<Record<string, number>>({});
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const task = tasks.find((t: any) => t.id === selectedTaskId);
  const currentSprint = getCurrentSprint();
  const nextSprint = getNextSprint();

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTagPoints(task.tagPoints || {});
    }
  }, [task]);

  const handleClose = () => {
    setIsOpen(false);
    setEditMode(false);
    setNewComment('');
  };

  const getTagName = (tagId: string) => {
    const tag = tags.find((t: any) => t.id === tagId);
    return tag?.name || 'Unknown';
  };

  const getTagColor = (tagId: string) => {
    const tag = tags.find((t: any) => t.id === tagId);
    return tag?.color || '#6B7280';
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

  const handleSaveEdit = async () => {
    if (!task) return;
    setSubmitting(true);
    try {
      await updateTask(task.id, { title, tagPoints });
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!task) return;
    await completeTask(task.id);
    handleClose();
  };

  const handleCancel = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to cancel this task?')) return;
    await cancelTask(task.id);
    handleClose();
  };

  const handleMove = async (sprintId: string | null) => {
    if (!task) return;
    await moveTask(task.id, sprintId);
  };

  const handleStartSession = async () => {
    if (!task) return;
    await startSession(task.id);
    handleClose();
  };

  const handleAddComment = async () => {
    if (!task || !newComment.trim()) return;
    await addComment(task.id, newComment.trim());
    setNewComment('');
  };

  const formatSessionDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime).getTime();
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    const minutes = Math.floor((end - start) / 60000);
    return `${minutes}m`;
  };

  if (!isOpen || !task) return null;

  const isActive = task.status === 'active';
  const totalPoints = Object.values(task.tagPoints || {}).reduce(
    (sum: number, p: any) => sum + p,
    0
  );

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-start justify-between mb-4">
          {editMode ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered flex-1 text-lg font-bold"
            />
          ) : (
            <h3 className="font-bold text-lg flex-1">{task.title}</h3>
          )}
          <button onClick={handleClose} className="btn btn-ghost btn-sm btn-square">
            <ion-icon name="close-outline" class="text-xl"></ion-icon>
          </button>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 mb-4">
          <span
            className={`badge ${
              task.status === 'completed'
                ? 'badge-success'
                : task.status === 'cancelled'
                ? 'badge-error'
                : 'badge-primary'
            }`}
          >
            {task.status}
          </span>
          {task.recurrence && (
            <span className="badge badge-outline">
              <ion-icon name="sync-outline" class="mr-1"></ion-icon>
              Recurring
            </span>
          )}
          <span className="text-sm text-base-content/60">{totalPoints} total points</span>
        </div>

        {/* Tag Points */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Tag Points</h4>
          {editMode ? (
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
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {Object.entries(task.tagPoints || {}).map(([tagId, points]) => (
                <span
                  key={tagId}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: getTagColor(tagId) + '20',
                    color: getTagColor(tagId),
                  }}
                >
                  {getTagName(tagId)}: {points as number}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Sprint */}
        {isActive && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Sprint</h4>
            <select
              value={task.sprintId || ''}
              onChange={(e) => handleMove(e.target.value || null)}
              className="select select-bordered w-full"
            >
              <option value="">Backlog</option>
              {currentSprint && (
                <option value={currentSprint.id}>This Week</option>
              )}
              {nextSprint && (
                <option value={nextSprint.id}>Next Week</option>
              )}
            </select>
          </div>
        )}

        {/* Sessions */}
        {task.sessions && task.sessions.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">Sessions</h4>
            <div className="space-y-2">
              {task.sessions.map((session: any, index: number) => (
                <div key={session.id || index} className="bg-base-200 rounded p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>
                      {formatDate(new Date(session.startTime))} at{' '}
                      {formatTime(new Date(session.startTime))}
                    </span>
                    <span className="text-base-content/60">
                      {formatSessionDuration(session.startTime, session.endTime)}
                    </span>
                  </div>
                  {session.focusLevel && (
                    <span
                      className={`badge badge-sm mt-1 ${
                        session.focusLevel === 'deep'
                          ? 'badge-success'
                          : session.focusLevel === 'moderate'
                          ? 'badge-info'
                          : session.focusLevel === 'shallow'
                          ? 'badge-warning'
                          : 'badge-error'
                      }`}
                    >
                      {session.focusLevel}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="mb-4">
          <h4 className="font-medium mb-2">Comments</h4>
          {task.comments && task.comments.length > 0 ? (
            <div className="space-y-2 mb-2">
              {task.comments.map((comment: any, index: number) => (
                <div key={comment.id || index} className="bg-base-200 rounded p-2 text-sm">
                  <p>{comment.text}</p>
                  <p className="text-xs text-base-content/60 mt-1">
                    {formatDate(new Date(comment.createdAt))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-base-content/60 mb-2">No comments yet</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input input-bordered input-sm flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="btn btn-sm btn-primary"
            >
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="modal-action flex-wrap gap-2">
          {editMode ? (
            <>
              <button onClick={() => setEditMode(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={submitting} className="btn btn-primary">
                {submitting ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </>
          ) : (
            <>
              {isActive && (
                <>
                  <button onClick={handleStartSession} className="btn btn-primary">
                    <ion-icon name="play-outline"></ion-icon>
                    Start Session
                  </button>
                  <button onClick={() => setEditMode(true)} className="btn btn-ghost">
                    <ion-icon name="create-outline"></ion-icon>
                    Edit
                  </button>
                  <button onClick={handleComplete} className="btn btn-success">
                    <ion-icon name="checkmark-outline"></ion-icon>
                    Complete
                  </button>
                  <button onClick={handleCancel} className="btn btn-ghost text-error">
                    <ion-icon name="trash-outline"></ion-icon>
                    Cancel Task
                  </button>
                </>
              )}
              {!isActive && (
                <button onClick={handleClose} className="btn btn-primary">
                  Close
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
