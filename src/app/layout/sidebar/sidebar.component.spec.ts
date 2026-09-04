import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { MonthYearService } from '../../core/services/month-year.service';
import { DashboardSummary } from '../../core/models';

function summary(overrides: Partial<DashboardSummary>): DashboardSummary {
  return {
    totalIncomeExpected: 0,
    totalIncomePaid: 0,
    totalExpenseExpected: 0,
    totalExpensePaid: 0,
    balanceExpected: 0,
    balancePaid: 0,
    totalIncomePending: 0,
    totalExpensePending: 0,
    totalOverdueAmount: 0,
    totalOverdueCount: 0,
    ...overrides,
  };
}

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let httpMock: HttpTestingController;
  let monthYear: MonthYearService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    monthYear = TestBed.inject(MonthYearService);
  });

  it('deve criar o componente', () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url.includes('/api/dashboard/summary')).flush(summary({}));
    expect(component).toBeTruthy();
  });

  describe('badge de pendências (overdueCount)', () => {
    it('mostra o badge com totalOverdueCount quando > 0', () => {
      fixture.detectChanges();
      const { month, year } = monthYear.selected();
      httpMock
        .expectOne((r) => r.url === `/api/dashboard/summary/${year}/${month}`)
        .flush(summary({ totalOverdueCount: 3 }));
      fixture.detectChanges();

      expect(component.overdueCount()).toBe(3);
      const badge = fixture.nativeElement.querySelector('.sidebar-badge');
      expect(badge).not.toBeNull();
      expect(badge.textContent).toContain('3');
    });

    it('não mostra badge quando totalOverdueCount é 0', () => {
      fixture.detectChanges();
      const { month, year } = monthYear.selected();
      httpMock
        .expectOne((r) => r.url === `/api/dashboard/summary/${year}/${month}`)
        .flush(summary({ totalOverdueCount: 0 }));
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.sidebar-badge')).toBeNull();
    });

    it('trocar de mês atualiza o badge pro valor do novo mês', () => {
      fixture.detectChanges();
      const { month, year } = monthYear.selected();
      httpMock
        .expectOne((r) => r.url === `/api/dashboard/summary/${year}/${month}`)
        .flush(summary({ totalOverdueCount: 1 }));

      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      monthYear.setMonthYear(nextMonth, nextYear);
      fixture.detectChanges();

      httpMock
        .expectOne((r) => r.url === `/api/dashboard/summary/${nextYear}/${nextMonth}`)
        .flush(summary({ totalOverdueCount: 5 }));
      fixture.detectChanges();

      expect(component.overdueCount()).toBe(5);
      // gap encontrado pelo /spec-verify: só o signal era reverificado, nunca o
      // badge renderizado de fato no DOM após a troca de mês.
      const badge = fixture.nativeElement.querySelector('.sidebar-badge');
      expect(badge.textContent).toContain('5');
    });
  });
});
