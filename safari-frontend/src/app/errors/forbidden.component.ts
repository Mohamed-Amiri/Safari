import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** 403 — signed in as a traveler but hit an admin route. Designed .bigcode screen. */
@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <div class="bigcode">
        <div class="code">403</div>
        <h2>This area needs an admin account</h2>
        <p>You're signed in as a traveler. The admin console is reserved for Voyage staff.</p>
        <a class="btn btn-primary" routerLink="/">Back to Explore</a>
      </div>
    </div>
  `
})
export class ForbiddenComponent {}
