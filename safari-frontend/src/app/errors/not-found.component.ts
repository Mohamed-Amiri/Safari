import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** 404 — designed .bigcode screen. */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="wrap">
      <div class="bigcode">
        <div class="code">404</div>
        <h2>This trip has wandered off</h2>
        <p>The page you're after doesn't exist — it may have been removed, or the link is wrong.</p>
        <a class="btn btn-primary" routerLink="/">Back to Explore</a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
