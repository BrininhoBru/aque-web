import {
  Component,
  ElementRef,
  HostListener,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MAIN_NAV, SECONDARY_NAV, NavItem } from '../nav-items';

const ALL_ITEMS: NavItem[] = [...MAIN_NAV, ...SECONDARY_NAV];

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [],
  templateUrl: './command-palette.component.html',
  styles: [`
    .command-palette-backdrop {
      z-index: 60;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 12vh;
      background: rgba(44, 36, 22, 0.5);
      backdrop-filter: blur(4px);
    }
    .command-palette {
      width: 100%;
      max-width: 32rem;
      max-height: 60vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .command-palette-input {
      border: none;
      border-bottom: 1px solid var(--color-ledger-border-lt);
      border-radius: 0;
      width: 100%;
    }
    .command-palette-list {
      overflow-y: auto;
    }
    .command-palette-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.625rem 1rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--color-ledger-ink);
    }
    .command-palette-item.active {
      background: var(--color-ledger-stripe);
    }
  `],
})
export class CommandPaletteComponent {
  private readonly router = inject(Router);

  readonly open = signal(false);
  readonly query = signal('');
  readonly activeIndex = signal(0);

  readonly items = computed(() => {
    const q = this.query().trim().toLowerCase();
    return ALL_ITEMS.filter((i) => !q || i.label.toLowerCase().includes(q));
  });

  private readonly queryInput = viewChild<ElementRef<HTMLInputElement>>('queryInput');
  private previouslyFocused: HTMLElement | null = null;

  constructor() {
    afterRenderEffect(() => {
      if (this.open()) {
        this.queryInput()?.nativeElement.focus();
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (
      (event.metaKey || event.ctrlKey) &&
      !event.shiftKey &&
      !event.altKey &&
      event.key.toLowerCase() === 'k'
    ) {
      event.preventDefault();
      if (!this.open()) this.openPalette();
      return;
    }

    if (!this.open()) return;

    if (event.key === 'Escape') {
      this.close();
    } else if (event.key === 'Tab') {
      // único elemento focável hoje é o input de busca — "trap" é mantê-lo focado
      event.preventDefault();
      this.queryInput()?.nativeElement.focus();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((i) => Math.min(i + 1, this.items().length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      const target = this.items()[this.activeIndex()];
      if (target) this.selectItem(target);
    }
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  selectItem(item: NavItem): void {
    this.router.navigate([item.path]);
    this.close();
  }

  private openPalette(): void {
    this.previouslyFocused = document.activeElement as HTMLElement;
    this.query.set('');
    this.activeIndex.set(0);
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
  }
}
