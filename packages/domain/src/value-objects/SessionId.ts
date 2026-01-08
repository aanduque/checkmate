/**
 * Strongly-typed identifier for Sessions
 */
export class SessionId {
  private readonly _brand: 'SessionId' = 'SessionId';

  private constructor(private readonly value: string) {
    if (!value || value.trim() === '') {
      throw new Error('SessionId cannot be empty');
    }
  }

  static create(): SessionId {
    return new SessionId(crypto.randomUUID());
  }

  static fromString(value: string): SessionId {
    return new SessionId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: SessionId): boolean {
    return this.value === other.value;
  }
}
