import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AdminService } from '../../core/services/admin.service';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { ConfirmDialogService } from '../../shared/ui/confirm-dialog/confirm-dialog.service';
import { ApiError } from '../../core/api/api-error';
import { User } from '../../core/models/models';
import { IsoDatePipe } from '../../shared/ui/pipes/date.pipe';
import { initials } from '../../shared/ui/util/display.util';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [IsoDatePipe],
  template: `
    <div class="adm-head">
      <div>
        <h1>User management</h1>
        <div class="sub">Promote travelers to admins, or remove accounts</div>
      </div>
    </div>

    @if (loading()) {
      <div style="padding:40px;text-align:center;color:var(--muted)">Loading users…</div>
    } @else if (error()) {
      <div class="banner err">{{ error() }}</div>
    } @else {
      <div class="admpanel" style="padding:0">
        <div class="admtoolbar" style="padding:16px 18px 4px">
          <input class="inp" placeholder="Search name or email…" [value]="query()" (input)="onSearch($event)">
          <div class="spacer"></div>
          <span class="cnt">{{ filtered().length }} SHOWN</span>
        </div>
        <div style="padding:6px 18px 16px;overflow-x:auto">
          <table class="table">
            <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th style="text-align:right">Actions</th></tr></thead>
            <tbody>
              @if (!filtered().length) {
                <tr><td colspan="5" style="padding:34px;text-align:center;color:var(--muted)">No users match “{{ query() }}”.</td></tr>
              }
              @for (u of filtered(); track u.id) {
                <tr>
                  <td>
                    <div class="thumbcell">
                      <span class="avatar">{{ initialsOf(u) }}</span>
                      <div><b>{{ u.fullName }}{{ self(u) ? '· You' : '' }}</b><span class="mono">ID {{ u.id }}</span></div>
                    </div>
                  </td>
                  <td class="mono" style="font-size:12px">{{ u.email }}</td>
                  <td><span class="rolepill" [class.admin]="u.role==='ROLE_ADMIN'" [class.user]="u.role==='ROLE_USER'">{{ u.role.replace('ROLE_', '') }}</span></td>
                  <td class="num">{{ u.createdAt.slice(0, 10) | isoDate }}</td>
                  <td class="acts">
                    @if (self(u)) {
                      <span class="mono" style="font-size:10px;color:var(--faint)">CURRENT SESSION</span>
                    } @else {
                      @if (u.role === 'ROLE_USER') {
                        <button class="btn btn-ghost btn-sm" type="button" (click)="promote(u)">Promote</button>
                      }
                      <button class="btn btn-danger btn-sm" type="button" (click)="remove(u)">Delete</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
      <p class="caveat">GET /admin/users returns the full list — search here is client-side. Promotions apply at the user's next sign-in (the JWT embeds the role). There is no demote endpoint yet.</p>
    }
  `,
  styleUrl: './admin.common.scss',
  styles: [`
    .caveat{font-family:var(--ff-m);font-size:10px;color:var(--faint);margin-top:12px;letter-spacing:.06em;text-transform:uppercase}
    .table .avatar{width:36px;height:36px;border-radius:3px;background:var(--green-soft);color:var(--green);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;border:1px solid var(--green-line);flex:none}
  `]
})
export class AdminUsersComponent implements OnInit {
  private adminApi = inject(AdminService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private dialog = inject(ConfirmDialogService);

  protected loading = signal(true);
  protected error = signal<string | null>(null);
  protected all = signal<User[]>([]);
  protected query = signal('');

  /** Client-side search over name + email — GET /admin/users is unfiltered/unpaged. */
  protected filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const list = this.all();
    return (q ? list.filter(u => (u.fullName + ' ' + u.email).toLowerCase().includes(q)) : list)
      .slice()
      .sort((a, b) => a.id - b.id);
  });

  ngOnInit(): void {
    this.adminApi.users().subscribe({
      next: list => { this.all.set(list ?? []); this.loading.set(false); },
      error: (e: ApiError) => { this.error.set(e.message); this.loading.set(false); }
    });
  }

  protected onSearch(ev: Event): void { this.query.set((ev.target as HTMLInputElement).value); }
  protected self(u: User): boolean { return this.auth.user()?.id === u.id; }
  protected initialsOf(u: User): string { return initials(u.firstName, u.lastName); }

  promote(u: User): void {
    this.dialog.show({
      title: 'Promote to admin?',
      body: `${u.fullName} will get full console access: trips, users and stats. Their current session keeps ROLE_USER until they sign in again — the token embeds the role.`,
      confirmText: 'Promote to admin', cancelText: 'Not now',
      onOk: () => {
        this.adminApi.promote(u.id).subscribe({
          next: () => {
            this.all.update(list => list.map(x => x.id === u.id ? { ...x, role: 'ROLE_ADMIN' } : x));
            this.toast.success(`${u.fullName} is now an admin — effective at their next sign-in`);
          },
          error: (e: ApiError) => this.toast.error(e.message)
        });
      }
    });
  }

  remove(u: User): void {
    this.dialog.show({
      tone: 'danger', title: 'Delete this account?',
      body: `${u.fullName} (${u.email}) will be permanently removed, along with their bookings, reviews and saved trips. Confirmed seats are released back on sale.`,
      confirmText: 'Delete account', cancelText: 'Keep account',
      onOk: () => {
        this.adminApi.deleteUser(u.id).subscribe({
          next: () => {
            this.all.update(list => list.filter(x => x.id !== u.id));
            this.toast.success('Account deleted');
          },
          error: (e: ApiError) => this.toast.error(e.message)
        });
      }
    });
  }
}
