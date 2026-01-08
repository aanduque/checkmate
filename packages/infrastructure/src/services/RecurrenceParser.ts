import { RRule, Weekday } from 'rrule';

export interface ParsedRecurrence {
  rrule: RRule;
  description: string;
}

/**
 * Service for parsing and working with RRULE recurrence patterns
 */
export class RecurrenceParser {
  private static readonly DESCRIPTIONS: Record<string, string> = {
    'FREQ=DAILY': 'Every day',
    'FREQ=WEEKLY': 'Every week',
    'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR': 'Weekdays',
    'FREQ=WEEKLY;BYDAY=MO,WE,FR': 'Mon, Wed, Fri',
    'FREQ=WEEKLY;BYDAY=TU,TH': 'Tue, Thu',
    'FREQ=MONTHLY': 'Every month',
  };

  /**
   * Parse an RRULE string into an RRule object
   */
  parse(rruleString: string, dtstart?: Date): ParsedRecurrence {
    const start = dtstart || new Date();
    const fullRule = `DTSTART:${this.formatDate(start)}\nRRULE:${rruleString}`;
    const rrule = RRule.fromString(fullRule);

    return {
      rrule,
      description: this.describe(rruleString, rrule),
    };
  }

  /**
   * Get the next occurrence after a given date
   */
  getNextOccurrence(rruleString: string, after: Date = new Date()): Date | null {
    try {
      const { rrule } = this.parse(rruleString, after);
      return rrule.after(after);
    } catch (e) {
      console.error('RRule error:', e);
      return null;
    }
  }

  /**
   * Get occurrences within a date range
   */
  getOccurrences(
    rruleString: string,
    range: { start: Date; end: Date }
  ): Date[] {
    try {
      const { rrule } = this.parse(rruleString, range.start);
      return rrule.between(range.start, range.end, true);
    } catch (e) {
      console.error('RRule error:', e);
      return [];
    }
  }

  /**
   * Get a human-readable description of the recurrence
   */
  describe(rruleString: string, rrule?: RRule): string {
    // Check for known patterns first
    const known = RecurrenceParser.DESCRIPTIONS[rruleString];
    if (known) return known;

    // Try to generate description from RRule
    if (rrule) {
      try {
        return rrule.toText();
      } catch {
        // Fall through to default
      }
    }

    return rruleString;
  }

  /**
   * Validate an RRULE string
   */
  validate(rruleString: string): { valid: boolean; error?: string } {
    try {
      this.parse(rruleString);
      return { valid: true };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}
