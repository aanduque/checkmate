/**
 * Recurrence value object - wraps RRULE string
 * Validation is delegated to infrastructure layer
 */
export class Recurrence {
  private readonly _brand: 'Recurrence' = 'Recurrence';

  private constructor(private readonly rruleString: string) {}

  static create(rruleString: string): Recurrence {
    if (!rruleString || rruleString.trim() === '') {
      throw new Error('Recurrence rule cannot be empty');
    }
    // Basic validation - must start with FREQ=
    if (!rruleString.includes('FREQ=')) {
      throw new Error('Invalid recurrence rule: must contain FREQ=');
    }
    return new Recurrence(rruleString);
  }

  static fromString(value: string): Recurrence {
    return Recurrence.create(value);
  }

  toString(): string {
    return this.rruleString;
  }

  equals(other: Recurrence): boolean {
    return this.rruleString === other.rruleString;
  }
}

// Common recurrence patterns
export const RecurrencePatterns = {
  DAILY: 'FREQ=DAILY',
  WEEKLY: 'FREQ=WEEKLY',
  WEEKDAYS: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
  MON_WED_FRI: 'FREQ=WEEKLY;BYDAY=MO,WE,FR',
  TUE_THU: 'FREQ=WEEKLY;BYDAY=TU,TH',
  MONTHLY: 'FREQ=MONTHLY',
} as const;
