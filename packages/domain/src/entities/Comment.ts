import { CommentId } from '../value-objects/CommentId';

export interface CommentProps {
  id: CommentId;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  skipJustification: boolean;
}

export interface CreateCommentProps {
  content: string;
  skipJustification?: boolean;
}

/**
 * Comment entity - owned by Task aggregate
 * Supports Markdown content
 */
export class Comment {
  private constructor(
    private readonly _id: CommentId,
    private _content: string,
    private readonly _createdAt: Date,
    private _updatedAt: Date | undefined,
    private readonly _skipJustification: boolean
  ) {}

  static create(props: CreateCommentProps): Comment {
    if (!props.content || props.content.trim() === '') {
      throw new Error('Comment content cannot be empty');
    }

    return new Comment(
      CommentId.create(),
      props.content.trim(),
      new Date(),
      undefined,
      props.skipJustification ?? false
    );
  }

  static fromProps(props: CommentProps): Comment {
    return new Comment(
      props.id,
      props.content,
      props.createdAt,
      props.updatedAt,
      props.skipJustification
    );
  }

  get id(): CommentId {
    return this._id;
  }

  get content(): string {
    return this._content;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date | undefined {
    return this._updatedAt;
  }

  get skipJustification(): boolean {
    return this._skipJustification;
  }

  updateContent(content: string): void {
    if (!content || content.trim() === '') {
      throw new Error('Comment content cannot be empty');
    }
    this._content = content.trim();
    this._updatedAt = new Date();
  }

  toData(): {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string | null;
    skipJustification: boolean;
  } {
    return {
      id: this._id.toString(),
      content: this._content,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt?.toISOString() ?? null,
      skipJustification: this._skipJustification,
    };
  }
}
