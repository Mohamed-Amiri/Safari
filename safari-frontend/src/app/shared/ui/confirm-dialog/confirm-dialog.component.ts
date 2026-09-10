import { Component, HostListener, inject } from '@angular/core';
import { ConfirmDialogService } from './confirm-dialog.service';

/** Renders the active dialog over a scrim overlay. Hosted once at the app root.
 *  Esc dismisses (when not okOnly), clicking the scrim dismisses. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (svc.open(); as d) {
      <div class="dlg-overlay" (click)="overlay($event)">
        <div class="dlg" [class.danger]="d.tone === 'danger'">
          <h3>{{ d.title }}</h3>
          <div class="dbody">{{ d.body }}</div>
          <div class="dacts">
            @if (!d.okOnly) {
              <button class="btn btn-ghost" (click)="svc.cancel()">{{ d.cancelText || 'Go back' }}</button>
            }
            <button class="btn"
                    [class.btn-bad]="d.tone === 'danger'"
                    [class.btn-primary]="d.tone !== 'danger'"
                    (click)="svc.confirm()">
              {{ d.confirmText || 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dlg-overlay{position:fixed;inset:0;background:rgba(17,24,15,.52);z-index:90;display:flex;align-items:center;justify-content:center;padding:20px;animation:fin .15s ease}
    @keyframes fin{from{opacity:0}to{opacity:1}}
    .dlg{background:var(--paper);border-radius:7px;max-width:460px;width:100%;padding:26px;border-top:4px solid var(--green)}
    .dlg.danger{border-top-color:var(--bad)}
    .dlg h3{font-size:19px;margin-bottom:9px}
    .dlg .dbody{font-size:14.3px;color:var(--ink2);line-height:1.6;margin-bottom:22px;white-space:pre-line}
    .dlg .dacts{display:flex;justify-content:flex-end;gap:10px}
  `]
})
export class ConfirmDialogComponent {
  protected svc = inject(ConfirmDialogService);

  overlay(ev: MouseEvent): void {
    if (ev.target === ev.currentTarget) this.svc.cancel();
  }

  @HostListener('keydown', ['$event'])
  onKey(ev: KeyboardEvent): void {
    if (ev.key !== 'Escape' || this.svc.open()?.okOnly) return;
    this.svc.cancel();
  }
}
