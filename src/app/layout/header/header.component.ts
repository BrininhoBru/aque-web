import { Component, inject } from '@angular/core';
import { MonthYearService } from '../../core/services/month-year.service';
import { MonthYearPipe } from '../../shared/pipes/month-year.pipe';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MonthYearPipe],
  templateUrl: './header.component.html',
  styles: [`
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      height: 3.5rem;
      flex-shrink: 0;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
    }
    .header-month {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .header-month-display {
      padding: 0.375rem 1rem;
      border-radius: 8px;
      background: var(--color-surface2);
      min-width: 160px;
      text-align: center;
      font-family: var(--font-display);
      font-size: 0.9rem;
      font-weight: 700;
      color: #f1f5f9;
      letter-spacing: -0.01em;
    }
    .btn-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-nav:hover {
      background: var(--color-surface2);
      color: #cbd5e1;
    }
    .header-logout {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .header-logout:hover {
      background: var(--color-surface2);
      color: #e2e8f0;
    }
  `],
})
export class HeaderComponent {
  readonly monthYear = inject(MonthYearService);
  readonly auth = inject(AuthService);
}
