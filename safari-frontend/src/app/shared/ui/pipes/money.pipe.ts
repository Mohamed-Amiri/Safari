import { Pipe, PipeTransform } from '@angular/core';

/** Price display. Prices are stored and entered in MAD (Moroccan dirham) and rendered
 * as e.g. "13,120 DH". No currency conversion is applied — the platform reserves seats;
 * it does not take payment. */
@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const mad = Number(value ?? 0);
    return mad.toLocaleString('en-US') + ' DH';
  }
}

