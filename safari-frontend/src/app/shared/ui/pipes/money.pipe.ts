import { Pipe, PipeTransform } from '@angular/core';

/** $ + en-US grouping. Numbers come back as plain JSON numbers per handoff §2 (date formats). */
@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return '$' + Number(value ?? 0).toLocaleString('en-US');
  }
}
