/**
 * Strongly-typed identifier for Tags
 */
export class TagId {
  private readonly _brand: 'TagId' = 'TagId';

  private constructor(private readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('TagId cannot be empty');
    }
  }

  static create(): TagId {
    return new TagId(crypto.randomUUID());
  }

  static fromString(value: string): TagId {
    return new TagId(value);
  }

  static untagged(): TagId {
    return new TagId('untagged');
  }

  toString(): string {
    return this.value;
  }

  equals(other: TagId): boolean {
    return this.value === other.value;
  }

  isUntagged(): boolean {
    return this.value === 'untagged';
  }
}
