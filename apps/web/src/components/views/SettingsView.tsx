import React, { useState, useEffect } from 'react';
import { tagApi, TagDTO } from '../../services/rpcClient';
import { Modal } from '../common/Modal';

export function SettingsView() {
  const [tags, setTags] = useState<TagDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateTag, setShowCreateTag] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const result = await tagApi.getAll();
      setTags(result.tags);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    try {
      // Collect all localStorage data with checkmate prefix
      const backup: Record<string, unknown> = {};
      const keys = ['checkmate_tasks', 'checkmate_tags', 'checkmate_sprints'];

      for (const key of keys) {
        const data = localStorage.getItem(key);
        if (data) {
          backup[key] = JSON.parse(data);
        }
      }

      // Create and download the file
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `checkmate-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      // Restore each key
      for (const [key, value] of Object.entries(backup)) {
        if (key.startsWith('checkmate_')) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }

      // Reload the page to reflect changes
      window.location.reload();
    } catch (err) {
      setError('Failed to import data. Please check the file format.');
    }

    // Reset file input
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {error && (
        <div className="alert alert-warning mb-4">
          <span>{error}</span>
        </div>
      )}

      {/* Tags Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Tags</h2>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateTag(true)}
          >
            + Add Tag
          </button>
        </div>

        {tags.length === 0 ? (
          <div className="card bg-base-200">
            <div className="card-body text-center">
              <p className="text-base-content/70">
                No tags yet. Create tags to categorize your tasks.
              </p>
              <button
                className="btn btn-primary btn-sm mx-auto mt-2"
                onClick={() => setShowCreateTag(true)}
              >
                Create First Tag
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {tags.map((tag) => (
              <div key={tag.id} className="card bg-base-200">
                <div className="card-body p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.icon}
                      </span>
                      <div>
                        <div className="font-medium">{tag.name}</div>
                        <div className="text-sm text-base-content/60">
                          Default capacity: {tag.defaultCapacity} points
                        </div>
                      </div>
                    </div>
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Data Backup Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Data Backup</h2>
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <p className="text-sm text-base-content/70 mb-4">
              Export your data as a JSON file for backup, or import a previous backup.
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                className="btn btn-outline btn-sm"
                onClick={handleExport}
              >
                Export Data
              </button>
              <label className="btn btn-outline btn-sm">
                Import Data
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* App Info Section */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">About</h2>
        <div className="card bg-base-200">
          <div className="card-body p-4">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-base-content/70">Version</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-base-content/70">Architecture</span>
                <span>DDD + CQRS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Create Tag Modal */}
      <CreateTagModal
        isOpen={showCreateTag}
        onClose={() => setShowCreateTag(false)}
        onCreated={loadTags}
      />
    </div>
  );
}

// Create Tag Modal Component
interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function CreateTagModal({ isOpen, onClose, onCreated }: CreateTagModalProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📌');
  const [color, setColor] = useState('#6b7280');
  const [capacity, setCapacity] = useState(13);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setIcon('📌');
      setColor('#6b7280');
      setCapacity(13);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setLoading(true);
      await tagApi.create({
        name: name.trim(),
        icon,
        color,
        defaultCapacity: capacity
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag');
    } finally {
      setLoading(false);
    }
  };

  const presetColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#14b8a6', // teal
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#6b7280'  // gray
  ];

  const presetIcons = ['📌', '💼', '🏠', '💪', '📚', '🎨', '🔧', '💰', '🎯'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Tag">
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Work, Personal, Health"
            autoFocus
          />
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Icon</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {presetIcons.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`btn btn-square btn-sm ${
                  icon === emoji ? 'btn-primary' : 'btn-ghost'
                }`}
                onClick={() => setIcon(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Color</span>
          </label>
          <div className="flex gap-2 flex-wrap">
            {presetColors.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${
                  color === c ? 'border-base-content' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Weekly Capacity (points)</span>
          </label>
          <input
            type="range"
            min={5}
            max={34}
            value={capacity}
            onChange={(e) => setCapacity(parseInt(e.target.value))}
            className="range range-primary"
          />
          <div className="flex justify-between text-xs px-2 mt-1">
            <span>5</span>
            <span className="font-bold">{capacity}</span>
            <span>34</span>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-4">
          <label className="label">
            <span className="label-text">Preview</span>
          </label>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-base-200">
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: color }}
            >
              {icon}
            </span>
            <span className="font-medium">{name || 'Tag Name'}</span>
            <span className="badge badge-sm ml-auto">{capacity} pts/week</span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !name.trim()}
          >
            {loading ? <span className="loading loading-spinner loading-sm" /> : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
