/**
 * LocalStorageCommentRepository - Persists comments to localStorage
 *
 * Stores comments with their associated taskId to enable findByTaskId queries.
 * The save method requires taskId since Comment entity doesn't carry this info.
 */

import { ICommentRepository, Comment, CommentObject } from '@checkmate/domain';

const STORAGE_KEY = 'checkmate_comments';

interface StoredComment {
  comment: CommentObject;
  taskId: string;
}

export class LocalStorageCommentRepository implements ICommentRepository {
  constructor(private readonly storage: Storage) {}

  private loadAll(): Record<string, StoredComment> {
    const data = this.storage.getItem(STORAGE_KEY);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private saveAll(comments: Record<string, StoredComment>): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(comments));
  }

  async save(comment: Comment, taskId?: string): Promise<void> {
    const comments = this.loadAll();
    const existing = comments[comment.id];

    // Use existing taskId if not provided (for updates)
    const effectiveTaskId = taskId ?? existing?.taskId ?? '';

    comments[comment.id] = {
      comment: comment.toObject(),
      taskId: effectiveTaskId
    };
    this.saveAll(comments);
  }

  async findById(id: string): Promise<Comment | null> {
    const comments = this.loadAll();
    const stored = comments[id];
    if (!stored) return null;
    return Comment.fromObject(stored.comment);
  }

  async findByTaskId(taskId: string): Promise<Comment[]> {
    const comments = this.loadAll();
    return Object.values(comments)
      .filter(stored => stored.taskId === taskId)
      .map(stored => Comment.fromObject(stored.comment));
  }

  async delete(id: string): Promise<void> {
    const comments = this.loadAll();
    delete comments[id];
    this.saveAll(comments);
  }
}
