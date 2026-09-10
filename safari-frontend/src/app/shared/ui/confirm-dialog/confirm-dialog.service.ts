import { Injectable, signal } from '@angular/core';

export type DialogTone = 'default' | 'danger';

export interface DialogConfig {
  title: string;
  body: string;          // plain text only — template binds via {{ }}, so no HTML is interpolated
  confirmText?: string;
  cancelText?: string;
  okOnly?: boolean;      // true → render only the confirm button (used for blocked-delete)
  tone?: DialogTone;
  onOk?: () => void | Promise<void>;
}

/**
 * Single-instance dialog stack backed by a signal. open() returns a resume helper;
 * closeDlg() unmounts. The container component (app-dialog-host) renders the markup.
 * Hosted at the app root so any feature can open() without DI gymnastics.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly open = signal<DialogConfig | null>(null);

  show(cfg: DialogConfig): void {
    this.open.set(cfg);
  }

  confirm(): void {
    const cfg = this.open();
    const onOk = cfg?.onOk;
    this.open.set(null);
    if (onOk) Promise.resolve(onOk()).catch(() => {});
  }

  cancel(): void {
    this.open.set(null);
  }
}
