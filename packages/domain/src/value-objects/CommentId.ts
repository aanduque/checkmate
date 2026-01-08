/**
 * Strongly-typed identifier for Comments
 */
export class CommentId {
  private readonly _brand: 'CommentId' = 'CommentId';

  private constructor(private readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('CommentId cannot be empty');
    }
  }

  static create(): CommentId {
    return new CommentId(crypto.randomUUID());
  }

  static fromString(value: string): CommentId {
    return new CommentId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: CommentId): boolean {
    return this.value === other.value;
  }
}
