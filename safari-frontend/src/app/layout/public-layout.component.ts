import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header.component';
import { FooterComponent } from './footer.component';

/** Public shell: site header + routed content + site footer. Auth pages register/login
 *  and the admin console render outside this shell (full-bleed). */
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <app-header />
    <main><router-outlet /></main>
    <app-footer />
  `
})
export class PublicLayoutComponent {}
