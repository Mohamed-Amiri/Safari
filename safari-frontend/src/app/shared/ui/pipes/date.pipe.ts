import { Pipe, PipeTransform } from '@angular/core';

/**
 * Long format: "Apr 12, 2026".
 * Input dates arrive as YYYY-MM-DD (handoff §2). Appending T00:00:00 pins them to local
 * midnight so the day is rendered consistently regardless of host timezone.
 */
@Pipe({ name: 'isoDate', standalone: true })
export class IsoDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

/** Short format: "Apr 12" — used in compact meta rows. */
@Pipe({ name: 'isoDateShort', standalone: true })
export class IsoDateShortPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const d = new Date(value + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

/** "Apr 12, 2026" rendered from a full ISO LocalDateTime timestamp (no offset per handoff).
 *  Slices off the time portion before reusing the long formatter. */
@Pipe({ name: 'isoDateTime', standalone: true })
export class IsoDateTimePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return new IsoDatePipe().transform(value.slice(0, 10));
  }
}
