/**
 * FocusLevel - Rating of focus quality during a session
 * Value Object: Immutable, equality by value
 */

export const FOCUS_LEVELS = ['distracted', 'neutral', 'focused'] as const;
export type FocusLevelType = (typeof FOCUS_LEVELS)[number];

export class FocusLevel {
  private constructor(private readonly _value: FocusLevelType) {}

  get value(): FocusLevelType {
    return this._value;
  }

  /**
   * Create FocusLevel from a string value
   */
  static create(value: FocusLevelType): FocusLevel {
    if (!FOCUS_LEVELS.includes(value)) {
      throw new Error(
        `Invalid focus level: ${value}. Must be one of: ${FOCUS_LEVELS.join(', ')}`
      );
    }
    return new FocusLevel(value);
  }

  /**
   * Factory for distracted level
   */
  static distracted(): FocusLevel {
    return new FocusLevel('distracted');
  }

  /**
   * Factory for neutral level
   */
  static neutral(): FocusLevel {
    return new FocusLevel('neutral');
  }

  /**
   * Factory for focused level
   */
  static focused(): FocusLevel {
    return new FocusLevel('focused');
  }

  isDistracted(): boolean {
    return this._value === 'distracted';
  }

  isNeutral(): boolean {
    return this._value === 'neutral';
  }

  isFocused(): boolean {
    return this._value === 'focused';
  }

  /**
   * Returns true if focus was positive (focused)
   */
  isPositive(): boolean {
    return this._value === 'focused';
  }

  equals(other: FocusLevel): boolean {
    return this._value === other._value;
  }
}
