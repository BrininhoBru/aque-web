import { Component, inject } from '@angular/core';
import { MonthYearService } from '../../core/services/month-year.service';
import { MonthYearPipe } from '../../shared/pipes/month-year.pipe';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutService } from '../layout.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MonthYearPipe],
  templateUrl: './header.component.html',
  styles: [`
    :host {
      display: contents;
    }
    .header-month {
      display: flex;
      align-items: center;
      gap: 4px;
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
    }
    .header-month-display {
      font-family: var(--font-serif);
      font-size: 17px;
      font-weight: 600;
      color: var(--color-ledger-ink);
      min-width: 140px;
      text-align: center;
      letter-spacing: -0.01em;
    }
    .btn-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-ledger-sm);
      border: 1px solid var(--color-ledger-border-md);
      background: var(--color-ledger-card);
      color: var(--color-ledger-ink-md);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-nav:hover {
      border-color: var(--color-ledger-border-st);
      background: var(--color-ledger-surface);
    }
    .header-logout {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: var(--radius-ledger-sm);
      font-size: 13px;
      font-weight: 500;
      color: var(--color-ledger-ink-lt);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .header-logout:hover {
      background: var(--color-ledger-stripe);
      color: var(--color-ledger-ink);
    }
    @media (max-width: 479px) {
      .header-logout-text {
        display: none;
      }
    }
  `],
})
export class HeaderComponent {
  readonly monthYear = inject(MonthYearService);
  readonly auth = inject(AuthService);
  readonly layout = inject(LayoutService);
}
