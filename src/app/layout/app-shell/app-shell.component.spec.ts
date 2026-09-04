import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AppShellComponent } from './app-shell.component';

function press(key: string, opts: Partial<KeyboardEventInit> = {}): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, ...opts }));
}

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    // sidebar dispara a carga do badge de pendências ao montar — flush pra não
    // deixar request pendente
    httpMock.expectOne((r) => r.url.includes('/api/dashboard/summary')).flush({
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
    });
  });

  it('deve criar o shell com a paleta de comando montada', () => {
    expect(fixture.nativeElement.querySelector('app-command-palette')).not.toBeNull();
  });

  // gap encontrado pelo /spec-verify (spec #38): o critério "Cmd+K funciona em
  // qualquer tela autenticada" só era provado com o CommandPaletteComponent
  // isolado, nunca de dentro do AppShellComponent — que é o que efetivamente
  // envolve toda rota autenticada do app.
  it('Cmd+K abre a paleta de comando de dentro do shell autenticado', () => {
    expect(fixture.nativeElement.querySelector('.command-palette')).toBeNull();

    press('k', { metaKey: true });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.command-palette')).not.toBeNull();
  });
});
