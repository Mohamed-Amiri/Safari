import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

/** Fixed bottom-center toast stack (prototype #toasts / .toast). Auto-dismiss is handled
 *  in ToastService; each toast offers a manual ✕. */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div id="toasts">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class.err]="t.type === 'err'" [class.info]="t.type === 'info'">
          <span>{{ t.message }}</span>
          <button class="x" aria-label="Dismiss" (click)="toasts.dismiss(t.id)">✕</button>
        </div>
      }
    </div>
  `,
  styles: [`
    #toasts{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:100;display:flex;flex-direction:column;gap:9px;align-items:center}
    .toast{background:var(--ink);color:#f5f2e8;border-radius:4px;padding:11px 16px;font-size:13.8px;font-weight:500;display:flex;gap:10px;align-items:center;box-shadow:0 10px 28px rgba(20,24,16,.28);border-left:3px solid var(--green-mid);animation:tin .22s ease;max-width:min(560px,90vw)}
    .toast.err{border-left-color:var(--bad)}
    .toast.info{border-left-color:var(--amber)}
    .toast .x{background:none;border:none;color:rgba(245,242,232,.6);font-size:15px;padding:0 0 0 4px}
    @keyframes tin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  `]
})
export class ToastContainerComponent {
  protected toasts = inject(ToastService);
}
