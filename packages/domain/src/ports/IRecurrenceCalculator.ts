/**
 * IRecurrenceCalculator - Port interface for recurrence calculation
 *
 * Per DEC-020 (RRule) and DEC-024 (Hexagonal Architecture):
 * - Domain defines this interface
 * - Infrastructure implements via RRule library
 * - Domain remains pure with zero external dependencies
 *
 * Uses RFC 5545 RRULE format:
 * - FREQ=DAILY - Every day
 * - FREQ=WEEKLY;BYDAY=MO,WE,FR - Mon/Wed/Fri
 * - FREQ=MONTHLY;BYMONTHDAY=1 - First of each month
 */

/**
 * Result of parsing an RRULE string
 */
export interface ParsedRRule {
  /**
   * The original RRULE string
   */
  readonly rruleString: string;

  /**
   * Whether the RRULE was successfully parsed
   */
  readonly isValid: boolean;

  /**
   * Human-readable description of the recurrence pattern
   */
  readonly description?: string;
}

/**
 * Result of validating an RRULE string
 */
export interface RRuleValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Port interface for calculating recurrence dates
 * Used by RecurringTaskSpawner to determine when to create task instances
 */
export interface IRecurrenceCalculator {
  /**
   * Parse an RRULE string into a structured representation
   * Returns a ParsedRRule object (never throws)
   */
  parse(rrule: string): ParsedRRule;

  /**
   * Validate an RRULE string
   * Returns validation result indicating if RRULE is valid
   */
  validate(rrule: string): RRuleValidationResult;

  /**
   * Get the next occurrence after a given date
   * Returns null if there are no more occurrences
   */
  getNextOccurrence(rrule: string, after: Date): Date | null;

  /**
   * Get all occurrences within a date range
   * Returns array of dates when the recurrence occurs
   */
  getOccurrences(rrule: string, start: Date, end: Date): Date[];

  /**
   * Get a human-readable description of the recurrence pattern
   */
  getDescription(rrule: string): string;
}
