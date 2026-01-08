import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { taskApi, tagApi, TagDTO } from '../../services/rpcClient';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  sprintId?: string;
}

export function CreateTaskModal({ isOpen, onClose, onCreated, sprintId }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [tagPoints, setTagPoints] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadTags();
      setTitle('');
      setTagPoints({});
      setError(null);
    }
  }, [isOpen]);

  const loadTags = async () => {
    try {
      const result = await tagApi.getAll();
      setTags(result.tags);
      // Initialize with default points for first tag if exists
      if (result.tags.length > 0) {
        setTagPoints({ [result.tags[0].name.toLowerCase()]: 3 });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (Object.keys(tagPoints).length === 0) {
      setError('At least one tag with points is required');
      return;
    }

    try {
      setLoading(true);
      await taskApi.create({
        title: title.trim(),
        tagPoints,
        sprintId
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleTagPointsChange = (tagName: string, points: number) => {
    if (points <= 0) {
      const newPoints = { ...tagPoints };
      delete newPoints[tagName];
      setTagPoints(newPoints);
    } else {
      setTagPoints({ ...tagPoints, [tagName]: points });
    }
  };

  const fibonacciPoints = [1, 2, 3, 5, 8, 13, 21];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Title</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            autoFocus
          />
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Points by Tag</span>
          </label>
          {tags.length === 0 ? (
            <div className="text-sm text-base-content/70">
              No tags available. Create tags in settings first.
            </div>
          ) : (
            <div className="space-y-3">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-3">
                  <span
                    className="badge"
                    style={{ backgroundColor: tag.color, color: 'white' }}
                  >
                    {tag.icon} {tag.name}
                  </span>
                  <div className="flex gap-1 flex-wrap">
                    {fibonacciPoints.map((pts) => (
                      <button
                        key={pts}
                        type="button"
                        className={`btn btn-xs ${
                          tagPoints[tag.name.toLowerCase()] === pts
                            ? 'btn-primary'
                            : 'btn-ghost'
                        }`}
                        onClick={() => handleTagPointsChange(tag.name.toLowerCase(), pts)}
                      >
                        {pts}
                      </button>
                    ))}
                    {tagPoints[tag.name.toLowerCase()] && (
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost text-error"
                        onClick={() => handleTagPointsChange(tag.name.toLowerCase(), 0)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-base-content/70">
            Total: {Object.values(tagPoints).reduce((a, b) => a + b, 0)} points
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !title.trim()}
            >
              {loading ? <span className="loading loading-spinner loading-sm" /> : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
