import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LOGO_SVG } from '../shared/ui/util/display.util';

/** Public footer — "Voyage" wordmark, Explore category quick-links, account + support,
 *  base line. Some support links are non-functional (matching the prototype's `data-act="nope"`). */
@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="site-foot">
      <div class="wrap">
        <div class="cols">
          <div>
            <a class="logo" routerLink="/" [innerHTML]="logo"></a>
            <p class="tag">A modern travel agency for everywhere worth going. Real availability, transparent pricing, and seats you can reserve in seconds.</p>
            <div class="coords">EST. 2024 · SMALL-GROUP TRAVEL, WORLDWIDE</div>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><a routerLink="/" [queryParams]="{}">All trips</a></li>
              <li><a routerLink="/" [queryParams]="{category:'Cultural'}">Cultural trips</a></li>
              <li><a routerLink="/" [queryParams]="{category:'Adventure'}">Adventures</a></li>
              <li><a routerLink="/" [queryParams]="{category:'Beach & Coast'}">Beach & coast</a></li>
              <li><a routerLink="/" [queryParams]="{category:'Relaxation'}">Relaxation</a></li>
              <li><a routerLink="/" [queryParams]="{category:'Nature & Wildlife'}">Nature & wildlife</a></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li><a routerLink="/dashboard">Dashboard</a></li>
              <li><a routerLink="/bookings">My bookings</a></li>
              <li><a routerLink="/saved">Saved trips</a></li>
              <li><a routerLink="/account">Profile & password</a></li>
              <li><a routerLink="/register">Create account</a></li>
            </ul>
          </div>
          <div>
            <h4>Support</h4>
            <ul>
              <li>Help centre</li>
              <li>Booking terms</li>
              <li>Contact us</li>
            </ul>
          </div>
        </div>
        <div class="base">
          <span>© 2026 Voyage — Your next trip, reserved</span>
          <span>Live seat availability · Prices in USD (MAD shown)</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .site-foot{background:var(--green-deep);color:rgba(240,236,220,.72)}
    .site-foot .cols{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:30px;padding:46px 0 38px}
    .site-foot .logo{display:inline-flex;align-items:center;gap:10px;color:#fff;margin-bottom:12px;font-family:var(--ff-d);font-weight:800;font-size:20px;letter-spacing:-.02em;text-decoration:none}
    .site-foot .logo ::ng-deep svg{flex:none}
    .site-foot .tag{font-size:13.5px;max-width:280px;line-height:1.6}
    .site-foot .coords{font-family:var(--ff-m);font-size:10px;letter-spacing:.1em;color:rgba(240,236,220,.4);margin-top:16px;text-transform:uppercase}
    .site-foot h4{font-family:var(--ff-m);font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:var(--amber);margin-bottom:14px;font-weight:500}
    .site-foot ul{list-style:none}
    .site-foot li{margin-bottom:9px}
    .site-foot .cols a{color:rgba(240,236,220,.78);font-size:13.5px}
    .site-foot .cols a:hover{color:#fff;text-decoration:underline}
    .site-foot .cols li{color:rgba(240,236,220,.78);font-size:13.5px}
    .site-foot .base{border-top:1px solid rgba(255,255,255,.1);padding:16px 0;display:flex;justify-content:space-between;gap:14px;font-family:var(--ff-m);font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:rgba(240,236,220,.45);flex-wrap:wrap}
    @media (max-width:860px){ .site-foot .cols{grid-template-columns:1fr 1fr} }
  `]
})
export class FooterComponent {
  protected logo = LOGO_SVG + 'Voyage';
}
