import { Injectable, signal, computed } from '@angular/core';

export interface MonthYear {
  month: number; // 1-12
  year: number;
}

@Injectable({ providedIn: 'root' })
export class MonthYearService {
  private readonly _selected = signal<MonthYear>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  readonly selected = this._selected.asReadonly();
  readonly month = computed(() => this._selected().month);
  readonly year = computed(() => this._selected().year);

  nextMonth(): void {
    const { month, year } = this._selected();
    if (month === 12) {
      this._selected.set({ month: 1, year: year + 1 });
    } else {
      this._selected.set({ month: month + 1, year });
    }
  }

  previousMonth(): void {
    const { month, year } = this._selected();
    if (month === 1) {
      this._selected.set({ month: 12, year: year - 1 });
    } else {
      this._selected.set({ month: month - 1, year });
    }
  }

  setMonthYear(month: number, year: number): void {
    this._selected.set({ month, year });
  }
}
