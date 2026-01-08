import React, { useState, useEffect } from 'react';
import { useStore, useSelector } from 'statux';
import type { TaskDTO, TagDTO } from '../../services/rpcClient';
import type { AppState } from '../../store';

interface Session {
  id: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes: number;
  focusLevel?: 'distracted' | 'neutral' | 'focused';
  status: 'in_progress' | 'completed' | 'abandoned';
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  skipJustification?: boolean;
  cancelJustification?: boolean;
}

interface ExtendedTask extends TaskDTO {
  description?: string;
  createdAt?: string;
  sessions?: Session[];
  comments?: Comment[];
  location?: { type: 'backlog' } | { type: 'sprint'; sprintId: string };
  parentId?: string;
  recurrence?: string;
}

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ExtendedTask | null;
  onUpdated?: () => void;
  onStartSession?: (taskId: string) => void;
  onOpenAddManualSession?: (taskId: string) => void;
  onOpenCancelTask?: (taskId: string) => void;
}

const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21];

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  onUpdated,
  onStartSession,
  onOpenAddManualSession,
  onOpenCancelTask
}: TaskDetailModalProps) {
  const tags = useSelector<TagDTO[]>('tags');
  const activeSession = useSelector<AppState['ui']['activeSession']>('ui.activeSession');

  const [editedTask, setEditedTask] = useState<ExtendedTask | null>(null);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  if (!isOpen || !editedTask) return null;

  const getTagById = (tagId: string) => tags.find(t => t.id === tagId);

  const getUnassignedTags = () =>
    tags.filter(t => !editedTask.tagPoints[t.id]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatSessionTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTaskAge = () => {
    if (!editedTask.createdAt) return 0;
    const created = new Date(editedTask.createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTask({ ...editedTask, title: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedTask({ ...editedTask, description: e.target.value });
  };

  const handlePointsChange = (tagId: string, points: number) => {
    const newTagPoints = { ...editedTask.tagPoints, [tagId]: points };
    setEditedTask({ ...editedTask, tagPoints: newTagPoints });
  };

  const handleRemoveTag = (tagId: string) => {
    const newTagPoints = { ...editedTask.tagPoints };
    delete newTagPoints[tagId];
    setEditedTask({ ...editedTask, tagPoints: newTagPoints });
  };

  const handleAddTag = (tagId: string) => {
    const newTagPoints = { ...editedTask.tagPoints, [tagId]: 1 };
    setEditedTask({ ...editedTask, tagPoints: newTagPoints });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      content: newComment.trim(),
      createdAt: new Date().toISOString()
    };
    const comments = [...(editedTask.comments || []), comment];
    setEditedTask({ ...editedTask, comments });
    setNewComment('');
  };

  const handleDeleteComment = (commentId: string) => {
    const comments = (editedTask.comments || []).filter(c => c.id !== commentId);
    setEditedTask({ ...editedTask, comments });
  };

  const handleSave = () => {
    // TODO: Call RPC to save task
    onUpdated?.();
    onClose();
  };

  const isActive = editedTask.status === 'active';
  const isCompleted = editedTask.status === 'completed';
  const isCanceled = editedTask.status === 'canceled';

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-2xl">
        {/* Close Button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={handleSave}
        >
          ✕
        </button>

        {/* Header with Status Icon */}
        <div className="flex items-start gap-2 mb-4">
          {isCompleted && (
            <ion-icon name="checkmark-circle-outline" class="text-success text-xl mt-1"></ion-icon>
          )}
          {isCanceled && (
            <ion-icon name="close-circle-outline" class="text-error text-xl mt-1"></ion-icon>
          )}
          {editedTask.recurrence && (
            <ion-icon name="repeat-outline" class="text-secondary text-xl mt-1"></ion-icon>
          )}
          <div className="flex-1">
            <input
              type="text"
              value={editedTask.title}
              onChange={handleTitleChange}
              className="input input-ghost text-xl font-bold w-full p-0 h-auto focus:bg-base-200"
              disabled={!isActive}
            />
            <div className="flex items-center gap-2 text-sm opacity-60 mt-1">
              {editedTask.createdAt && (
                <>
                  <span>Created {formatDate(editedTask.createdAt)}</span>
                  <span>•</span>
                  <span>{getTaskAge()} days old</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <textarea
            value={editedTask.description || ''}
            onChange={handleDescriptionChange}
            rows={3}
            className="textarea textarea-bordered w-full"
            placeholder="Add description..."
            disabled={!isActive}
          />
        </div>

        {/* Tags & Points */}
        <div className="mb-6">
          <label className="label">
            <span className="label-text">Tags & Points</span>
          </label>
          <div className="flex flex-wrap gap-2 items-center">
            {Object.entries(editedTask.tagPoints).map(([tagId, points]) => {
              const tag = getTagById(tagId);
              if (!tag) return null;
              return (
                <div
                  key={tagId}
                  className="badge badge-lg gap-1 pr-1"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    borderColor: tag.color
                  }}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.name}</span>
                  <select
                    value={points}
                    onChange={(e) => handlePointsChange(tagId, parseInt(e.target.value))}
                    className="bg-transparent border-none text-sm font-bold w-14"
                    disabled={!isActive}
                  >
                    {FIBONACCI_POINTS.map(pt => (
                      <option key={pt} value={pt}>{pt}pt</option>
                    ))}
                  </select>
                  {isActive && (
                    <button
                      onClick={() => handleRemoveTag(tagId)}
                      className="btn btn-ghost btn-xs btn-circle h-5 w-5 min-h-0 opacity-60 hover:opacity-100 hover:bg-error/20"
                    >
                      <ion-icon name="close-outline" class="text-sm"></ion-icon>
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add Tag Dropdown */}
            {isActive && getUnassignedTags().length > 0 && (
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1">
                  <ion-icon name="add-outline"></ion-icon>
                  Add Tag
                </div>
                <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-10 w-52 p-2 shadow-lg border border-base-300">
                  {getUnassignedTags().map(tag => (
                    <li key={tag.id}>
                      <a onClick={() => handleAddTag(tag.id)} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                        <span>{tag.icon}</span>
                        <span>{tag.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sessions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="label-text font-medium">Focus Sessions</label>
            <div className="flex gap-1">
              <button
                onClick={() => onOpenAddManualSession?.(editedTask.id)}
                disabled={!isActive}
                className="btn btn-ghost btn-xs"
              >
                + Add Manual
              </button>
              <button
                onClick={() => {
                  onStartSession?.(editedTask.id);
                  onClose();
                }}
                disabled={!!activeSession || !isActive}
                className="btn btn-ghost btn-xs text-primary"
              >
                + Start Session
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(editedTask.sessions || []).slice().reverse().map(session => (
              <div key={session.id} className="bg-base-200 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ion-icon
                      name={
                        session.status === 'completed' ? 'checkmark-outline' :
                        session.status === 'abandoned' ? 'close-outline' : 'play-outline'
                      }
                      class={
                        session.status === 'completed' ? 'text-success' :
                        session.status === 'abandoned' ? 'text-error' : 'text-info'
                      }
                    ></ion-icon>
                    <span>{formatDate(session.startedAt)}</span>
                    {session.endedAt && (
                      <span className="opacity-60">
                        ({formatSessionTime(
                          Math.floor((new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
                        )})
                      </span>
                    )}
                  </div>
                  {session.focusLevel && (
                    <span className={`badge badge-sm ${
                      session.focusLevel === 'focused' ? 'badge-success' :
                      session.focusLevel === 'neutral' ? 'badge-warning' : 'badge-error'
                    }`}>
                      {session.focusLevel}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!editedTask.sessions?.length && (
              <p className="text-sm opacity-50 italic">No sessions yet</p>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className="mb-6">
          <label className="label-text font-medium mb-2 block">Comments</label>
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {(editedTask.comments || []).map(comment => (
              <div
                key={comment.id}
                className={`bg-base-200 rounded-lg p-3 ${
                  comment.skipJustification ? 'border-l-4 border-l-warning' :
                  comment.cancelJustification ? 'border-l-4 border-l-error' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {comment.skipJustification && (
                      <span className="badge badge-warning badge-sm mb-1">Skip Justification</span>
                    )}
                    {comment.cancelJustification && (
                      <span className="badge badge-error badge-sm mb-1">Cancellation Reason</span>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    <p className="text-xs opacity-50 mt-1">{formatDate(comment.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="btn btn-ghost btn-xs text-error"
                  >
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyUp={(e) => e.key === 'Enter' && handleAddComment()}
              className="input input-bordered input-sm flex-1"
              placeholder="Add a comment..."
            />
            <button onClick={handleAddComment} className="btn btn-ghost btn-sm">
              Add
            </button>
          </div>
        </div>

        {/* Location Info */}
        <div className="text-sm opacity-70">
          {editedTask.location && (
            <p className="flex items-center gap-1">
              Location:{' '}
              <span className="font-medium flex items-center gap-1">
                <ion-icon name={
                  editedTask.location.type === 'backlog' ? 'clipboard-outline' : 'calendar-outline'
                }></ion-icon>
                {editedTask.location.type === 'backlog' ? 'Backlog' : 'Sprint'}
              </span>
            </p>
          )}
          {editedTask.parentId && (
            <p className="mt-1 flex items-center gap-1">
              <ion-icon name="repeat-outline"></ion-icon> Instance of a recurring task
            </p>
          )}
        </div>

        {/* Danger Zone */}
        {isActive && (
          <div className="mt-6 pt-4 border-t border-base-300">
            <button
              onClick={() => onOpenCancelTask?.(editedTask.id)}
              className="btn btn-ghost btn-sm text-error gap-1"
            >
              <ion-icon name="close-circle-outline"></ion-icon>
              Cancel Task
            </button>
          </div>
        )}
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop" onClick={handleSave}>
        <button>close</button>
      </form>
    </dialog>
  );
}
