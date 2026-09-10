import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { LOGO_SVG } from '../shared/ui/util/display.util';

/** Public site header — logo "Voyage", primary nav, account avatar menu, admin link,
 *  guest sign-in CTAs. Mirrors header() in the prototype's 03-app.js. */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="site-head">
      <div class="wrap">
        <a class="logo" routerLink="/" [innerHTML]="logo"></a>
        <nav class="nav">
          <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{exact:true}">Explore trips</a>
          @if (user(); as u) {
            <a routerLink="/dashboard" routerLinkActive="on">Dashboard</a>
            <a routerLink="/saved" routerLinkActive="on">Saved</a>
            <a routerLink="/bookings" routerLinkActive="on">My bookings</a>
          }
        </nav>
        <div class="head-actions">
          @if (!user()) {
            <a class="btn btn-ghost btn-sm" routerLink="/login">Sign in</a>
            <a class="btn btn-cta btn-sm" routerLink="/register">Create account</a>
          } @else {
            @if (user()!.role === 'ROLE_ADMIN') {
              <a class="adminlink" routerLink="/admin">Admin console</a>
            }
            <button class="avbtn" (click)="menuOpen.set(!menuOpen())" (blur)="onBlur($event)">
              <span class="avatar">{{ initials() }}</span>
              <span class="nm">{{ user()!.firstName }}</span>
              <span style="color:var(--faint);font-size:10px">▾</span>
            </button>
            @if (menuOpen()) {
              <div class="pop">
                <div class="who">
                  <div class="nm">{{ user()!.fullName }}</div>
                  <div class="em">{{ user()!.email }}</div>
                </div>
                <div class="sep"></div>
                <a routerLink="/dashboard">Dashboard</a>
                <a routerLink="/bookings">My bookings</a>
                <a routerLink="/saved">Saved trips</a>
                <a routerLink="/account">Account settings</a>
                @if (user()!.role === 'ROLE_ADMIN') {
                  <a routerLink="/admin">Admin console</a>
                }
                <div class="sep"></div>
                <button (click)="logout()">Sign out</button>
              </div>
            }
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .site-head{background:var(--paper);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:40}
    .site-head .wrap{display:flex;align-items:center;gap:28px;height:64px}
    .logo{display:flex;align-items:center;gap:10px;font-family:var(--ff-d);font-weight:800;font-size:20px;letter-spacing:-.02em;color:var(--ink);text-decoration:none}
    .logo:hover{text-decoration:none}
    .logo ::ng-deep svg{flex:none}
    .nav{display:flex;gap:4px;margin-left:6px}
    .nav a{font-size:14px;font-weight:600;color:var(--ink2);padding:8px 12px;border-radius:3px}
    .nav a:hover{text-decoration:none;background:var(--sand2)}
    .nav a.on{color:var(--green);background:var(--green-soft)}
    .head-actions{margin-left:auto;display:flex;align-items:center;gap:10px;position:relative}
    .adminlink{font-family:var(--ff-m);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#fff;background:var(--green);padding:6px 11px;border-radius:2px}
    .adminlink:hover{background:var(--green-deep);text-decoration:none}
    .avatar{width:36px;height:36px;border-radius:3px;background:var(--green-soft);color:var(--green);font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;border:1px solid var(--green-line)}
    .avbtn{display:flex;align-items:center;gap:9px;background:none;border:1px solid transparent;padding:4px 6px;border-radius:3px}
    .avbtn:hover{border-color:var(--line2)}
    .avbtn .nm{font-weight:600;font-size:13.5px}
    .pop{position:absolute;top:calc(100% + 8px);right:0;background:var(--paper);border:1px solid var(--line2);border-radius:5px;min-width:220px;padding:6px;box-shadow:0 12px 32px rgba(24,28,18,.14);z-index:50}
    .pop a,.pop button{display:flex;width:100%;align-items:center;gap:10px;padding:9px 11px;border-radius:3px;font-size:13.5px;font-weight:500;color:var(--ink);background:none;border:none;text-align:left}
    .pop a:hover,.pop button:hover{background:var(--sand2);text-decoration:none}
    .pop .sep{height:1px;background:var(--line);margin:5px 4px}
    .pop .who{padding:9px 11px;border-bottom:1px solid var(--line);margin-bottom:5px}
    .pop .who .nm{font-weight:700;font-size:14px}
    .pop .who .em{font-family:var(--ff-m);font-size:11px;color:var(--muted)}
    @media (max-width:860px){ .nav{display:none} }
  `]
})
export class HeaderComponent {
  protected auth = inject(AuthService);
  protected menuOpen = signal(false);
  protected logo = LOGO_SVG + 'Voyage';
  protected user = computed(() => this.auth.user());

  protected initials(): string {
    const u = this.auth.user();
    return u ? (u.firstName[0] + u.lastName[0]).toUpperCase() : '–';
  }

  protected onBlur(_ev: FocusEvent): void {
    // close the menu shortly after the avbtn loses focus, unless focus moved into the pop
    setTimeout(() => {
      const active = document.activeElement;
      if (active && (active.closest('.pop') || active.closest('.avbtn'))) return;
      this.menuOpen.set(false);
    }, 120);
  }

  protected logout(): void {
    this.menuOpen.set(false);
    this.auth.logout();
  }
}
