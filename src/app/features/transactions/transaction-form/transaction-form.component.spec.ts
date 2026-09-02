import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TransactionFormComponent } from './transaction-form.component';
import { MonthYearService } from '../../../core/services/month-year.service';

describe('TransactionFormComponent', () => {
  let component: TransactionFormComponent;
  let fixture: ComponentFixture<TransactionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('formValid()', () => {
    it('deve ser inválido com campos vazios', () => {
      expect(component.formValid()).toBeFalse();
    });

    it('deve ser válido com todos os campos obrigatórios preenchidos', () => {
      component['model'].set({
        description: 'Aluguel',
        categoryId: 'cat-1',
        type: 'DESPESA',
        referenceMonth: '3',
        referenceYear: 2026,
        amountExpected: 1800,
        amountPaid: null,
        dueDate: null,
      });
      fixture.detectChanges();
      expect(component.formValid()).toBeTrue();
    });

    it('deve ser inválido com valor previsto zero', () => {
      component['model'].set({
        description: 'Aluguel',
        categoryId: 'cat-1',
        type: 'DESPESA',
        referenceMonth: '3',
        referenceYear: 2026,
        amountExpected: 0,
        amountPaid: null,
        dueDate: null,
      });
      fixture.detectChanges();
      expect(component.formValid()).toBeFalse();
    });

    it('deve ser inválido sem descrição', () => {
      component['model'].set({
        description: '',
        categoryId: 'cat-1',
        type: 'DESPESA',
        referenceMonth: '3',
        referenceYear: 2026,
        amountExpected: 500,
        amountPaid: null,
        dueDate: null,
      });
      fixture.detectChanges();
      expect(component.formValid()).toBeFalse();
    });

    it('deve ser inválido quando o ano de referência está fora de uma faixa plausível', () => {
      component['model'].set({
        description: 'Aluguel',
        categoryId: 'cat-1',
        type: 'DESPESA',
        referenceMonth: '3',
        referenceYear: 0,
        amountExpected: 500,
        amountPaid: null,
        dueDate: null,
      });
      fixture.detectChanges();
      expect(component.formValid()).toBeFalse();

      component['model'].update((m) => ({ ...m, referenceYear: 99999 }));
      fixture.detectChanges();
      expect(component.formValid()).toBeFalse();
    });

    it('deve ser inválido quando o valor pago é negativo', () => {
      component['model'].set({
        description: 'Aluguel',
        categoryId: 'cat-1',
        type: 'DESPESA',
        referenceMonth: '3',
        referenceYear: 2026,
        amountExpected: 500,
        amountPaid: -50,
        dueDate: null,
      });
      fixture.detectChanges();
      expect(component.formValid()).toBeFalse();
    });
  });

  describe('statusLabel()', () => {
    it('deve retornar PENDENTE quando amountPaid é null', () => {
      component['model'].update((m) => ({ ...m, amountPaid: null }));
      expect(component.statusLabel()).toBe('PENDENTE');
    });

    it('deve retornar PAGO quando amountPaid tem valor', () => {
      component['model'].update((m) => ({ ...m, amountPaid: 1800 }));
      expect(component.statusLabel()).toBe('PAGO');
    });

    it('deve retornar PENDENTE quando amountPaid é 0', () => {
      component['model'].update((m) => ({ ...m, amountPaid: 0 }));
      expect(component.statusLabel()).toBe('PENDENTE');
    });
  });

  describe('setType()', () => {
    it('deve atualizar o tipo e limpar a categoria', () => {
      component.transactionForm.categoryId().value.set('cat-123');
      component.setType('RECEITA');
      expect(component.transactionForm.type().value()).toBe('RECEITA');
      expect(component.transactionForm.categoryId().value()).toBe('');
    });
  });

  // aque-web#18: o <select> de mês não refletia o valor real do model no DOM (mostrava
  // sempre a primeira opção) — esses dois testes inspecionam o elemento renderizado,
  // não só o model, porque foi exatamente aí que o bug vivia.
  describe('sincronização do <select> de mês de referência', () => {
    let http: HttpTestingController;
    let monthYearService: MonthYearService;

    function setupWithRoute(routeParams: Record<string, string> = {}): void {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [TransactionFormComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: convertToParamMap(routeParams) } },
          },
        ],
      });

      monthYearService = TestBed.inject(MonthYearService);
      monthYearService.setMonthYear(5, 2027);

      fixture = TestBed.createComponent(TransactionFormComponent);
      http = TestBed.inject(HttpTestingController);
    }

    afterEach(() => http.verify());

    it('mostra o mês correto no select assim que a tela carrega, sem precisar tocar no campo', async () => {
      setupWithRoute();
      fixture.detectChanges();
      http.expectOne((req) => req.url.includes('/api/categories')).flush([]);
      // afterRenderEffect só roda depois que a view (incluindo as <option> do @for)
      // termina de montar — precisa esperar estabilizar antes de checar o DOM
      await fixture.whenStable();

      // segundo <select> da tela: o primeiro é "Categoria"
      const select: HTMLSelectElement = fixture.nativeElement.querySelectorAll('select')[1];
      expect(select.value).toBe('5');
    });

    it('reflete o mês do lançamento carregado na edição, não o mês global atual', async () => {
      setupWithRoute({ id: 'transacao-1' });
      fixture.detectChanges();
      http.expectOne((req) => req.url.includes('/api/categories')).flush([]);
      await fixture.whenStable();

      http.expectOne((req) => req.url.includes('/api/transactions')).flush([
        {
          id: 'transacao-1',
          description: 'Aluguel',
          category: { id: 'cat-1', name: 'Moradia', type: 'DESPESA', predefined: true },
          type: 'DESPESA',
          referenceMonth: 8,
          referenceYear: 2026,
          amountExpected: 1500,
          amountPaid: null,
          status: 'PENDENTE',
          dueDate: null,
          recurringId: null,
          isOverride: false,
        },
      ]);
      fixture.detectChanges();
      await fixture.whenStable();

      // segundo <select> da tela: o primeiro é "Categoria"
      const select: HTMLSelectElement = fixture.nativeElement.querySelectorAll('select')[1];
      expect(select.value).toBe('8');
    });
  });
});
