import React, { useState } from 'react';
import { useStore } from 'statux';
import { useTags } from '../../hooks/useTags';

const DEFAULT_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#84CC16',
  '#22C55E', '#14B8A6', '#06B6D4', '#3B82F6',
  '#6366F1', '#8B5CF6', '#A855F7', '#EC4899',
];

export function TagsModal() {
  const [isOpen, setIsOpen] = useStore<boolean>('ui.modals.tags');
  const [tags] = useStore<any[]>('tags');
  const { createTag, updateTag, deleteTag } = useTags();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setColor(DEFAULT_COLORS[0]);
    setShowForm(false);
  };

  const handleEdit = (tag: any) => {
    setEditingId(tag.id);
    setName(tag.name);
    setColor(tag.color);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await updateTag(editingId, { name: name.trim(), color });
      } else {
        await createTag({ name: name.trim(), color });
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save tag:', error);
      alert('Failed to save tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    if (!confirm('Are you sure you want to delete this tag? Tasks using this tag will not be affected.')) {
      return;
    }
    try {
      await deleteTag(tagId);
    } catch (error) {
      console.error('Failed to delete tag:', error);
      alert('Failed to delete tag');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Manage Tags</h3>
          <button onClick={handleClose} className="btn btn-ghost btn-sm btn-square">
            <ion-icon name="close-outline" class="text-xl"></ion-icon>
          </button>
        </div>

        {/* Tag List */}
        <div className="space-y-2 mb-4">
          {tags.map((tag: any) => (
            <div
              key={tag.id}
              className="flex items-center gap-3 p-3 bg-base-200 rounded-lg"
            >
              <div
                className="w-6 h-6 rounded-full"
                style={{ backgroundColor: tag.color }}
              ></div>
              <span className="flex-1 font-medium">{tag.name}</span>
              <button
                onClick={() => handleEdit(tag)}
                className="btn btn-ghost btn-sm btn-square"
              >
                <ion-icon name="create-outline"></ion-icon>
              </button>
              <button
                onClick={() => handleDelete(tag.id)}
                className="btn btn-ghost btn-sm btn-square text-error"
              >
                <ion-icon name="trash-outline"></ion-icon>
              </button>
            </div>
          ))}
          {tags.length === 0 && (
            <p className="text-center text-base-content/60 py-4">
              No tags yet. Create one to get started.
            </p>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm ? (
          <form onSubmit={handleSubmit} className="bg-base-200 rounded-lg p-4">
            <h4 className="font-medium mb-3">
              {editingId ? 'Edit Tag' : 'New Tag'}
            </h4>
            <div className="form-control mb-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tag name"
                className="input input-bordered w-full"
                autoFocus
              />
            </div>
            <div className="form-control mb-4">
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
            Add Tag
          </button>
        )}
      </div>
      <div className="modal-backdrop" onClick={handleClose}></div>
    </div>
  );
}
