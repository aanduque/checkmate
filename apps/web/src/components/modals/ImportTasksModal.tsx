import React, { useState, useMemo } from 'react';
import { useSelector } from 'statux';
import type { TagDTO } from '../../services/rpcClient';

interface ImportTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (tasks: ParsedTask[]) => void;
}

export interface ParsedTask {
  title: string;
  tags: TagDTO[];
  recurrence?: string;
}

export function ImportTasksModal({ isOpen, onClose, onImport }: ImportTasksModalProps) {
  const tags = useSelector<TagDTO[]>('tags');
  const [importText, setImportText] = useState('');
  const [importDefaultTagId, setImportDefaultTagId] = useState('');

  const getTagById = (tagId: string): TagDTO | undefined => {
    return tags.find(t => t.id === tagId);
  };

  const getTagByName = (name: string): TagDTO | undefined => {
    const lowerName = name.toLowerCase();
    return tags.find(t => t.name.toLowerCase() === lowerName);
  };

  // Parse import text into tasks
  const parseImportText = (text: string): ParsedTask[] => {
    if (!text.trim()) return [];

    const lines = text.split('\n');
    const parsedTasks: ParsedTask[] = [];

    for (const line of lines) {
      let trimmed = line.trim();
      if (!trimmed) continue;

      // Remove markdown checkbox
      trimmed = trimmed.replace(/^-\s*\[[ x]\]\s*/i, '');
      // Remove list marker
      trimmed = trimmed.replace(/^-\s*/, '');

      if (!trimmed) continue;

      // Extract tags (e.g., #work)
      const tagMatches = trimmed.match(/#(\w+)/g) || [];
      const foundTags: TagDTO[] = [];

      for (const match of tagMatches) {
        const tagName = match.slice(1); // Remove #
        const tag = getTagByName(tagName);
        if (tag) {
          foundTags.push(tag);
        }
      }

      // Remove tags from title
      let title = trimmed.replace(/#\w+/g, '').trim();

      // Extract recurrence (e.g., "every day", "every week", "every month")
      let recurrence: string | undefined;
      const recurrenceMatch = title.match(/\bevery\s+(day|week|month|weekday)\b/i);
      if (recurrenceMatch) {
        recurrence = recurrenceMatch[0];
        title = title.replace(recurrenceMatch[0], '').trim();
      }

      if (title) {
        parsedTasks.push({
          title,
          tags: foundTags,
          recurrence
        });
      }
    }

    return parsedTasks;
  };

  const parsedTasks = useMemo(() => parseImportText(importText), [importText, tags]);

  const handleImport = () => {
    // Apply default tag if no tags specified
    const tasksWithDefaults = parsedTasks.map(task => {
      if (task.tags.length === 0 && importDefaultTagId) {
        const defaultTag = getTagById(importDefaultTagId);
        if (defaultTag) {
          return { ...task, tags: [defaultTag] };
        }
      }
      return task;
    });

    onImport(tasksWithDefaults);
    setImportText('');
    setImportDefaultTagId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-lg">
        <h3 className="font-bold text-lg mb-4">Import Tasks</h3>
        <button
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          onClick={onClose}
        >
          ✕
        </button>

        <p className="text-sm opacity-70 mb-3">Paste your tasks below. Supported formats:</p>
        <ul className="text-xs opacity-60 mb-3 list-disc list-inside">
          <li><code>- [ ] Task name</code> - Markdown checkbox</li>
          <li><code>- Task name</code> - List item</li>
          <li><code>Task name</code> - Plain text</li>
          <li><code>#tagname</code> - Assign to tag</li>
          <li><code>every day/week/month</code> - Make recurring</li>
        </ul>

        <div className="form-control mb-3">
          <label className="label">
            <span className="label-text text-sm">Default tag (when no #tag specified)</span>
          </label>
          <select
            value={importDefaultTagId}
            onChange={(e) => setImportDefaultTagId(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="">No default tag</option>
            {tags.map(tag => (
              <option key={tag.id} value={tag.id}>{tag.name}</option>
            ))}
          </select>
        </div>

        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          className="textarea textarea-bordered w-full h-40 font-mono text-sm"
          placeholder={`- [ ] Review report #work
- [ ] Morning workout #health every day
Buy groceries`}
        />

        {/* Preview */}
        {importText.trim() && (
          <div className="mt-3 p-3 bg-base-200 rounded-lg">
            <p className="text-xs font-medium opacity-60 mb-2">
              Preview: {parsedTasks.length} tasks
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {parsedTasks.slice(0, 10).map((task, index) => (
                <div key={index} className="text-sm flex items-center gap-2">
                  <span className="opacity-50">{index + 1}.</span>
                  <span>{task.title}</span>
                  {task.tags.map(tag => (
                    <span
                      key={tag.id}
                      className="badge badge-xs"
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {task.tags.length === 0 && importDefaultTagId && (
                    <span
                      className="badge badge-xs"
                      style={{
                        backgroundColor: `${getTagById(importDefaultTagId)?.color}20`,
                        color: getTagById(importDefaultTagId)?.color
                      }}
                    >
                      {getTagById(importDefaultTagId)?.name}
                    </span>
                  )}
                  {task.recurrence && (
                    <span className="badge badge-xs badge-secondary">recurring</span>
                  )}
                </div>
              ))}
              {parsedTasks.length > 10 && (
                <p className="text-xs opacity-50">...and {parsedTasks.length - 10} more</p>
              )}
            </div>
          </div>
        )}

        <div className="modal-action">
          <button onClick={onClose} className="btn btn-ghost">
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="btn btn-primary gap-2"
          >
            <ion-icon name="download-outline"></ion-icon>
            Import {parsedTasks.length} Tasks
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
