/**
 * Comment - Notes attached to tasks
 * Entity: Has identity, mutable state
 *
 * Special flags indicate if comment is a justification for skip/cancel actions
 */

export interface CommentObject {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string | null;
  isSkipJustification: boolean;
  isCancelJustification: boolean;
}

export class Comment {
  private constructor(
    private readonly _id: string,
    private readonly _content: string,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date | null,
    private readonly _isSkipJustification: boolean,
    private readonly _isCancelJustification: boolean
  ) {}

  get id(): string { return this._id; }
  get content(): string { return this._content; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date | null { return this._updatedAt; }
  get isSkipJustification(): boolean { return this._isSkipJustification; }
  get isCancelJustification(): boolean { return this._isCancelJustification; }

  /**
   * Create a new comment
   */
  static create(props: { content: string }): Comment {
    const trimmed = props.content.trim();
    if (!trimmed) {
      throw new Error('Comment content cannot be empty');
    }

    return new Comment(
      Comment.generateId(),
      trimmed,
      new Date(),
      null,
      false,
      false
    );
  }

  /**
   * Create a skip justification comment
   */
  static createSkipJustification(content: string): Comment {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('Comment content cannot be empty');
    }

    return new Comment(
      Comment.generateId(),
      trimmed,
      new Date(),
      null,
      true,
      false
    );
  }

  /**
   * Create a cancel justification comment
   */
  static createCancelJustification(content: string): Comment {
    const trimmed = content.trim();
    if (!trimmed) {
      throw new Error('Comment content cannot be empty');
    }

    return new Comment(
      Comment.generateId(),
      trimmed,
      new Date(),
      null,
      false,
      true
    );
  }

  /**
   * Update the comment content
   */
  updateContent(newContent: string): Comment {
    const trimmed = newContent.trim();
    if (!trimmed) {
      throw new Error('Comment content cannot be empty');
    }

    return new Comment(
      this._id,
      trimmed,
      this._createdAt,
      new Date(),
      this._isSkipJustification,
      this._isCancelJustification
    );
  }

  /**
   * Recreate from a plain object
   */
  static fromObject(obj: CommentObject): Comment {
    return new Comment(
      obj.id,
      obj.content,
      new Date(obj.createdAt),
      obj.updatedAt ? new Date(obj.updatedAt) : null,
      obj.isSkipJustification,
      obj.isCancelJustification
    );
  }

  /**
   * Serialize to a plain object
   */
  toObject(): CommentObject {
    return {
      id: this._id,
      content: this._content,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt?.toISOString() ?? null,
      isSkipJustification: this._isSkipJustification,
      isCancelJustification: this._isCancelJustification
    };
  }

  private static generateId(): string {
    return `comment_${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}_${Date.now()}`;
  }
}
