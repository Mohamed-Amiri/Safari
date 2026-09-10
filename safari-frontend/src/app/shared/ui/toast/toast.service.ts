import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'err' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

/**
 * Global toast queue — thin signal-based store. Components push messages via show();
 * the ToastContainerComponent renders and auto-dismisses after the timeout alike the
 * prototype's fixed 4.2s. Closing a toast manually removes it by id.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  readonly toasts = signal<Toast[]>([]);

  show(message: string, type: ToastType = 'success'): void {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 4200);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'err'); }
  info(message: string): void { this.show(message, 'info'); }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
