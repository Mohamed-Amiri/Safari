import { Pipe, PipeTransform } from '@angular/core';

/** Price display. Numbers come back as plain JSON numbers per handoff §2 (date formats),
 *  stored and entered in USD. We render both USD and MAD so the platform reads naturally
 *  for its Morocco demo content and international travelers alike. The MAD figure is a
 *  fixed-rate conversion (no live FX in this build) — close enough for display, not for
 *  payment (the platform reserves seats; it does not take payment). */
@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  /** Display-only USD→MAD rate. prices are authored in USD; MAD is advisory only. */
  static readonly USD_TO_MAD = 10.1;

  transform(value: number | null | undefined): string {
    const usd = Number(value ?? 0);
    const usdFmt = '$' + usd.toLocaleString('en-US');
    const mad = Math.round(usd * MoneyPipe.USD_TO_MAD);
    const madFmt = 'DH ' + mad.toLocaleString('en-US');
    return `${usdFmt} · ${madFmt}`;
  }
}

