import React, { useState } from 'react';
import { useStore } from 'statux';
import type { TagDTO } from '../../services/rpcClient';

interface TagsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TagsModal({ isOpen, onClose }: TagsModalProps) {
  const [tags, setTags] = useStore<TagDTO[]>('tags');

  // New tag form state
  const [newTagIcon, setNewTagIcon] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#6366f1');
  const [newTagCapacity, setNewTagCapacity] = useState(8);

  const handleUpdateTag = (tag: TagDTO, updates: Partial<TagDTO>) => {
    setTags(prev => prev.map(t =>
      t.id === tag.id ? { ...t, ...updates } : t
    ));
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;

    const newTag: TagDTO = {
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      icon: newTagIcon || '📌',
      color: newTagColor,
      defaultCapacity: newTagCapacity || 8
    };

    setTags(prev => [...prev, newTag]);

    // Reset form
    setNewTagIcon('');
    setNewTagName('');
    setNewTagColor('#6366f1');
    setNewTagCapacity(8);
  };

  const handleDeleteTag = (tag: TagDTO) => {
    if (tag.id === 'untagged') return; // Protected tag

    if (confirm(`Delete tag "${tag.name}"? Tasks with this tag will become untagged.`)) {
      setTags(prev => prev.filter(t => t.id !== tag.id));
    }
  };

  if (!isOpen) return null;

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-lg max-h-[90vh]">
        {/* Close Button */}
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>

        <h3 className="text-lg font-bold mb-4">Manage Tags</h3>

        {/* Existing Tags */}
        <div className="space-y-3 mb-6">
          {tags.map(tag => (
            <div key={tag.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
              <input
                type="text"
                value={tag.icon}
                onChange={(e) => handleUpdateTag(tag, { icon: e.target.value })}
                className="input input-ghost w-12 text-center text-xl p-0"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={tag.name}
                  onChange={(e) => handleUpdateTag(tag, { name: e.target.value })}
                  className="input input-ghost font-medium p-0 h-auto w-full"
                  style={{ color: tag.color }}
                />
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={tag.color}
                    onChange={(e) => handleUpdateTag(tag, { color: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer"
                  />
                  <span className="text-xs opacity-60">Cap:</span>
                  <input
                    type="number"
                    value={tag.defaultCapacity}
                    onChange={(e) => handleUpdateTag(tag, { defaultCapacity: parseInt(e.target.value) || 1 })}
                    min={1}
                    className="input input-bordered input-xs w-16"
                  />
                </div>
              </div>
              <button
                onClick={() => handleDeleteTag(tag)}
                disabled={tag.id === 'untagged'}
                className="btn btn-ghost btn-sm text-error disabled:opacity-30"
              >
                <ion-icon name="trash-outline"></ion-icon>
              </button>
            </div>
          ))}
        </div>

        <div className="divider"></div>

        {/* Add New Tag */}
        <h4 className="font-medium mb-3">Add New Tag</h4>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            value={newTagIcon}
            onChange={(e) => setNewTagIcon(e.target.value)}
            className="input input-bordered w-12 text-center"
            placeholder="📌"
          />
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            className="input input-bordered flex-1 min-w-32"
            placeholder="Tag name"
          />
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <input
            type="number"
            value={newTagCapacity}
            onChange={(e) => setNewTagCapacity(parseInt(e.target.value) || 8)}
            min={1}
            className="input input-bordered w-16"
            placeholder="Cap"
          />
          <button
            onClick={handleAddTag}
            disabled={!newTagName.trim()}
            className="btn btn-primary"
          >
            Add
          </button>
        </div>
      </div>

      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
}
