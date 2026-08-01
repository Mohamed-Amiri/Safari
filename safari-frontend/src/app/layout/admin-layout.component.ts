import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { LOGO_SVG } from '../shared/ui/util/display.util';

/** Admin shell: deep-green sidebar (logo, dashboard/trips/users nav, signed-in user)
 *  + the routed admin content. Matches admShell() in the prototype's 04-admin.js. */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="adm">
      <aside class="adm-side">
        <a class="logo" routerLink="/" [innerHTML]="logo"></a>
        <div class="sect">Operations</div>
        <nav class="adm-nav">
          <a routerLink="/admin" routerLinkActive="on" [routerLinkActiveOptions]="{exact:true}">Dashboard</a>
          <a routerLink="/admin/trips" routerLinkActive="on">Trips</a>
          <a routerLink="/admin/users" routerLinkActive="on">Users</a>
        </nav>
        <div class="bottom">
          <div>{{ me()?.fullName ?? 'Voyage admin' }}</div>
          <div class="mono">{{ me()?.role ?? '' }}</div>
          <div style="margin-top:10px"><a routerLink="/">← Back to site</a></div>
        </div>
      </aside>
      <main class="adm-main"><router-outlet /></main>
    </div>
  `,
  styles: [`
    .adm{display:grid;grid-template-columns:224px 1fr;min-height:100vh;background:var(--sand)}
    .adm-side{background:var(--green-deep);color:rgba(240,236,220,.8);position:sticky;top:0;height:100vh;display:flex;flex-direction:column}
    .adm-side .logo{display:flex;align-items:center;gap:10px;color:#fff;padding:20px 22px 18px;border-bottom:1px solid rgba(255,255,255,.09);font-size:18px;font-family:var(--ff-d);font-weight:800;letter-spacing:-.02em;text-decoration:none}
    .adm-side .logo ::ng-deep svg{flex:none}
    .adm-side .sect{font-family:var(--ff-m);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(240,236,220,.42);padding:20px 22px 8px}
    .adm-nav a{display:flex;align-items:center;gap:11px;padding:10px 22px;color:rgba(240,236,220,.74);font-size:14px;font-weight:550;border-left:3px solid transparent}
    .adm-nav a:hover{color:#fff;text-decoration:none;background:rgba(255,255,255,.05)}
    .adm-nav a.on{color:#fff;background:rgba(255,255,255,.07);border-left-color:var(--amber)}
    .adm-side .bottom{margin-top:auto;padding:18px 22px;border-top:1px solid rgba(255,255,255,.09);font-size:12.5px}
    .adm-side .bottom .mono{font-size:10px;color:rgba(240,236,220,.5);letter-spacing:.08em;text-transform:uppercase;margin-top:3px}
    .adm-side .bottom a{color:var(--amber)}
    .adm-main{padding:30px 38px 60px;max-width:1180px;width:100%}
    @media (max-width:860px){
      .adm{display:block}
      .adm-side{position:static;height:auto}
      .adm-nav{display:flex;overflow-x:auto}
      .adm-nav a{border-left:none;border-bottom:3px solid transparent;white-space:nowrap}
      .adm-nav a.on{border-left:none;border-bottom-color:var(--amber)}
      .adm-side .bottom,.adm-side .sect{display:none}
      .adm-main{padding:22px 20px 50px}
    }
  `]
})
export class AdminLayoutComponent {
  private auth = inject(AuthService);
  protected logo = LOGO_SVG + 'Voyage';
  protected me = computed(() => this.auth.user());
}
