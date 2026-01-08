/**
 * FocusLevel value object - represents session focus quality
 */
const FOCUS_LEVELS = ['distracted', 'neutral', 'focused'] as const;
export type FocusLevelValue = (typeof FOCUS_LEVELS)[number];

export class FocusLevel {
  private readonly _brand: 'FocusLevel' = 'FocusLevel';

  private constructor(private readonly value: FocusLevelValue) {}

  static create(value: string): FocusLevel {
    if (!FOCUS_LEVELS.includes(value as FocusLevelValue)) {
      throw new Error(
        `Invalid focus level: ${value}. Must be one of: ${FOCUS_LEVELS.join(', ')}`
      );
    }
    return new FocusLevel(value as FocusLevelValue);
  }

  static distracted(): FocusLevel {
    return new FocusLevel('distracted');
  }

  static neutral(): FocusLevel {
    return new FocusLevel('neutral');
  }

  static focused(): FocusLevel {
    return new FocusLevel('focused');
  }

  static validValues(): readonly string[] {
    return FOCUS_LEVELS;
  }

  toString(): string {
    return this.value;
  }

  isDistracted(): boolean {
    return this.value === 'distracted';
  }

  isNeutral(): boolean {
    return this.value === 'neutral';
  }

  isFocused(): boolean {
    return this.value === 'focused';
  }

  equals(other: FocusLevel): boolean {
    return this.value === other.value;
  }
}
