/**
 * RRuleRecurrenceCalculator - Adapter implementing IRecurrenceCalculator
 *
 * Per DEC-020 (RRule) and DEC-024 (Hexagonal Architecture):
 * - Implements the domain port interface
 * - Uses rrule library for RFC 5545 RRULE parsing and calculation
 */

import { RRule, rrulestr } from 'rrule';
import type {
  IRecurrenceCalculator,
  ParsedRRule,
  RRuleValidationResult
} from '@checkmate/domain';

/**
 * Adapter that implements IRecurrenceCalculator using the rrule library
 */
export class RRuleRecurrenceCalculator implements IRecurrenceCalculator {
  /**
   * Parse an RRULE string into a structured representation
   */
  parse(rrule: string): ParsedRRule {
    if (!rrule || rrule.trim() === '') {
      return {
        rruleString: rrule,
        isValid: false
      };
    }

    try {
      const rule = this.parseRRule(rrule);
      return {
        rruleString: rrule,
        isValid: true,
        description: rule.toText()
      };
    } catch {
      return {
        rruleString: rrule,
        isValid: false
      };
    }
  }

  /**
   * Validate an RRULE string
   */
  validate(rrule: string): RRuleValidationResult {
    if (!rrule || rrule.trim() === '') {
      return { valid: false, error: 'RRULE cannot be empty' };
    }

    try {
      this.parseRRule(rrule);
      return { valid: true };
    } catch (err) {
      return {
        valid: false,
        error: err instanceof Error ? err.message : 'Invalid RRULE'
      };
    }
  }

  /**
   * Get the next occurrence after a given date
   */
  getNextOccurrence(rrule: string, after: Date): Date | null {
    try {
      // Parse the base rule to get options
      const baseRule = this.parseRRule(rrule);
      const options = baseRule.origOptions;

      // Create a new rule with dtstart set to 'after' for calculation
      // This ensures we find occurrences from that point forward
      const rule = new RRule({
        ...options,
        dtstart: after
      });

      // Get the first occurrence (which would be at or after 'after')
      const all = rule.all((date, i) => i < 2); // Get first 2 occurrences

      // If the first occurrence is exactly at 'after', return the second
      // Otherwise return the first
      if (all.length === 0) return null;
      if (all[0].getTime() === after.getTime() && all.length > 1) {
        return all[1];
      }
      return all[0];
    } catch {
      return null;
    }
  }

  /**
   * Get all occurrences within a date range
   */
  getOccurrences(rrule: string, start: Date, end: Date): Date[] {
    try {
      // Parse the base rule to get options
      const baseRule = this.parseRRule(rrule);
      const options = baseRule.origOptions;

      // Check if the rule has an UNTIL that's before our start date
      if (options.until && options.until < start) {
        return [];
      }

      // Create a new rule with dtstart set to 'start'
      const rule = new RRule({
        ...options,
        dtstart: start
      });

      // Get all occurrences between start and end (inclusive)
      return rule.between(start, end, true);
    } catch {
      return [];
    }
  }

  /**
   * Get a human-readable description of the recurrence pattern
   */
  getDescription(rrule: string): string {
    try {
      const rule = this.parseRRule(rrule);
      return rule.toText();
    } catch {
      return 'Invalid RRULE';
    }
  }

  /**
   * Internal helper to parse an RRULE string
   * Handles both full RRULE strings and shorthand formats
   */
  private parseRRule(rrule: string): RRule {
    // If the string starts with RRULE:, parse as-is
    // Otherwise, prepend RRULE: for parsing
    const fullRRule = rrule.startsWith('RRULE:') ? rrule : `RRULE:${rrule}`;
    return rrulestr(fullRRule);
  }
}
