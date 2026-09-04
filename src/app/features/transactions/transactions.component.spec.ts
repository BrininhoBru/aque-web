import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { TransactionsComponent } from './transactions.component';
import { Transaction, Category } from '../../core/models';
import { ToastService } from '../../shared/services/toast.service';

const despesaCategory: Category = { id: 'c1', name: 'Casa', type: 'DESPESA', predefined: false };
const receitaCategory: Category = { id: 'c2', name: 'Salário', type: 'RECEITA', predefined: false };

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: '1',
    description: 'X',
    category: despesaCategory,
    type: 'DESPESA',
    referenceMonth: 3,
    referenceYear: 2026,
    amountExpected: 100,
    amountPaid: null,
    status: 'PENDENTE',
    dueDate: null,
    recurringId: null,
    isOverride: false,
    ...overrides,
  };
}

describe('TransactionsComponent', () => {
  let component: TransactionsComponent;
  let fixture: ComponentFixture<TransactionsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('load() — race condition entre trocas rápidas de mês', () => {
    it('mantém o resultado da carga mais recente, mesmo se a resposta antiga chegar depois', () => {
      fixture.detectChanges(); // dispara o effect() do construtor (carga inicial)
      const { month, year } = component.monthYear.selected();

      const req1 = httpMock.expectOne(
        (r) => r.params.get('month') === String(month) && r.params.get('year') === String(year),
      );

      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      component.load(nextMonth, nextYear);

      const req2 = httpMock.expectOne(
        (r) =>
          r.params.get('month') === String(nextMonth) && r.params.get('year') === String(nextYear),
      );

      // resposta da 2ª (mais nova) chega primeiro, depois a da 1ª (obsoleta)
      req2.flush([tx({ id: 'novo' })]);
      req1.flush([tx({ id: 'antigo' })]);

      expect(component.transactions().map((t) => t.id)).toEqual(['novo']);
    });
  });

  describe('filtered()', () => {
    beforeEach(() => {
      component.transactions.set([
        tx({ id: '1', type: 'DESPESA', status: 'PENDENTE', category: despesaCategory }),
        tx({ id: '2', type: 'RECEITA', status: 'PAGO', category: receitaCategory }),
      ]);
    });

    it('sem filtros retorna tudo', () => {
      expect(component.filtered().length).toBe(2);
    });

    it('filtra por tipo', () => {
      component.setFilterType('RECEITA');
      expect(component.filtered().map((t) => t.id)).toEqual(['2']);
    });

    it('filtra por status', () => {
      component.setFilterStatus('PAGO');
      expect(component.filtered().map((t) => t.id)).toEqual(['2']);
    });

    it('filtra por categoria', () => {
      component.setFilterCategory('c1');
      expect(component.filtered().map((t) => t.id)).toEqual(['1']);
    });

    it('combina filtros (E lógico, não OU)', () => {
      component.setFilterType('DESPESA');
      component.setFilterStatus('PAGO');
      expect(component.filtered().length).toBe(0);
    });

    it('clearFilters() reseta todos os filtros', () => {
      component.setFilterType('RECEITA');
      component.setFilterStatus('PAGO');
      component.setFilterCategory('c2');
      component.clearFilters();
      expect(component.filtered().length).toBe(2);
    });

    it('clearFilters() também reseta busca, vencidos e ordenação', () => {
      component.searchText.set('algo');
      component.toggleOverdue();
      component.setSort('description');
      component.clearFilters();
      expect(component.searchText()).toBe('');
      expect(component.filterOverdue()).toBeFalse();
      expect(component.sortColumn()).toBeNull();
    });
  });

  describe('busca por texto (searchText)', () => {
    beforeEach(() => {
      component.transactions.set([
        tx({ id: '1', description: 'Aluguel de março', type: 'DESPESA' }),
        tx({ id: '2', description: 'Supermercado', type: 'DESPESA' }),
      ]);
    });

    it('filtra por descrição, case-insensitive', () => {
      component.searchText.set('aluguel');
      expect(component.filtered().map((t) => t.id)).toEqual(['1']);
    });

    it('combina com outros filtros já ativos', () => {
      component.setFilterType('RECEITA');
      component.searchText.set('aluguel');
      expect(component.filtered().length).toBe(0);
    });

    // gap encontrado pelo /spec-verify: os testes acima só chamavam searchText.set()
    // direto, nunca o evento (input) real do campo de busca renderizado.
    it('digitar no campo de busca (evento DOM real) filtra a tabela', () => {
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.nativeElement.querySelector(
        '.tx-filter-bar input[type="text"]',
      );
      input.value = 'supermercado';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(component.filtered().map((t) => t.id)).toEqual(['2']);
    });

    // gap: busca/sort/filtros nunca eram verificados contra os cards mobile,
    // que consomem o mesmo filtered() mas são um bloco de template separado.
    it('filtra também os cards mobile (mesmo filtered())', () => {
      component.searchText.set('aluguel');
      fixture.detectChanges(); // dispara o effect() do construtor (load() inicial)
      httpMock
        .expectOne((r) => r.url === '/api/transactions')
        .flush([
          tx({ id: '1', description: 'Aluguel de março', type: 'DESPESA' }),
          tx({ id: '2', description: 'Supermercado', type: 'DESPESA' }),
        ]);
      fixture.detectChanges();

      const cards = fixture.nativeElement.querySelectorAll('.tx-card-title');
      expect(cards.length).toBe(1);
      expect(cards[0].textContent).toContain('Aluguel de março');
    });
  });

  describe('ordenação de colunas (setSort)', () => {
    it('ordena por descrição, ascendente', () => {
      component.transactions.set([
        tx({ id: '1', description: 'Banana' }),
        tx({ id: '2', description: 'Abacaxi' }),
      ]);
      component.setSort('description');
      expect(component.filtered().map((t) => t.id)).toEqual(['2', '1']);
    });

    it('clicar na mesma coluna de novo inverte a direção', () => {
      component.transactions.set([
        tx({ id: '1', description: 'Banana' }),
        tx({ id: '2', description: 'Abacaxi' }),
      ]);
      component.setSort('description');
      component.setSort('description');
      expect(component.filtered().map((t) => t.id)).toEqual(['1', '2']);
    });

    it('trocar de coluna volta a ordenar ascendente', () => {
      component.transactions.set([
        tx({ id: '1', description: 'Banana', amountExpected: 100 }),
        tx({ id: '2', description: 'Abacaxi', amountExpected: 300 }),
      ]);
      component.setSort('description');
      component.setSort('description'); // desc: ['1', '2']
      component.setSort('amountExpected'); // troca de coluna: volta pra asc
      expect(component.filtered().map((t) => t.id)).toEqual(['1', '2']);
    });

    it('ordena por valor previsto numericamente', () => {
      component.transactions.set([
        tx({ id: '1', amountExpected: 300 }),
        tx({ id: '2', amountExpected: 100 }),
        tx({ id: '3', amountExpected: 200 }),
      ]);
      component.setSort('amountExpected');
      expect(component.filtered().map((t) => t.id)).toEqual(['2', '3', '1']);
    });

    it('ordena por vencimento sem quebrar quando algum é null', () => {
      component.transactions.set([
        tx({ id: '1', dueDate: '2026-03-15' }),
        tx({ id: '2', dueDate: null }),
        tx({ id: '3', dueDate: '2026-01-01' }),
      ]);
      component.setSort('dueDate');
      expect(component.filtered().map((t) => t.id)).toEqual(['2', '3', '1']);
    });

    // gap encontrado pelo /spec-verify: setSort() era só chamado direto, nunca via
    // clique real no <th>, e o indicador ▲/▼ nunca era verificado no DOM.
    it('clicar no <th> Descrição ordena e mostra o indicador ▲, clicar de novo mostra ▼', () => {
      fixture.detectChanges(); // dispara o effect() do construtor (load() inicial)
      httpMock
        .expectOne((r) => r.url === '/api/transactions')
        .flush([tx({ id: '1', description: 'Banana' }), tx({ id: '2', description: 'Abacaxi' })]);
      fixture.detectChanges();

      const descriptionHeader: HTMLElement = fixture.nativeElement.querySelectorAll('th')[1];
      descriptionHeader.click();
      fixture.detectChanges();

      expect(component.filtered().map((t) => t.id)).toEqual(['2', '1']);
      expect(descriptionHeader.textContent).toContain('▲');

      descriptionHeader.click();
      fixture.detectChanges();

      expect(descriptionHeader.textContent).toContain('▼');
    });

    // gap: nenhum teste combinava sort com um filtro de categoria/status ativo —
    // só busca+tipo tinha esse cruzamento coberto.
    it('ordenação opera só sobre os itens já filtrados por categoria/status', () => {
      component.transactions.set([
        tx({ id: '1', description: 'Zebra', category: despesaCategory, status: 'PENDENTE' }),
        tx({ id: '2', description: 'Abacaxi', category: despesaCategory, status: 'PAGO' }),
        tx({ id: '3', description: 'Mesa', category: receitaCategory, status: 'PENDENTE' }),
      ]);
      component.setFilterStatus('PENDENTE');
      component.setSort('description');

      // '2' está fora por causa do filtro de status, mesmo sendo alfabeticamente
      // o primeiro — a ordenação nunca deveria trazê-lo de volta
      expect(component.filtered().map((t) => t.id)).toEqual(['3', '1']);
    });
  });

  describe('chip de vencidos (toggleOverdue)', () => {
    it('mostra só lançamentos PENDENTE com vencimento no passado quando ativado', () => {
      component.transactions.set([
        tx({ id: '1', status: 'PENDENTE', dueDate: '2000-01-01' }),
        tx({ id: '2', status: 'PENDENTE', dueDate: '2999-01-01' }),
        tx({ id: '3', status: 'PAGO', dueDate: '2000-01-01' }),
        tx({ id: '4', status: 'PENDENTE', dueDate: null }),
      ]);
      component.toggleOverdue();
      expect(component.filtered().map((t) => t.id)).toEqual(['1']);
    });

    it('toggleOverdue() chamado de novo desativa o filtro', () => {
      component.transactions.set([tx({ id: '1', status: 'PENDENTE', dueDate: '2000-01-01' })]);
      component.toggleOverdue();
      component.toggleOverdue();
      expect(component.filtered().length).toBe(1);
    });
  });

  describe('persistência de filtros na URL', () => {
    describe('leitura inicial dos query params', () => {
      function setupWithQueryParams(params: Record<string, string> = {}): void {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          imports: [TransactionsComponent],
          providers: [
            provideHttpClient(),
            provideHttpClientTesting(),
            provideRouter([]),
            {
              provide: ActivatedRoute,
              useValue: { snapshot: { queryParamMap: convertToParamMap(params) } },
            },
          ],
        });

        fixture = TestBed.createComponent(TransactionsComponent);
        component = fixture.componentInstance;
        httpMock = TestBed.inject(HttpTestingController);
      }

      it('inicializa os filtros a partir dos query params da URL', () => {
        setupWithQueryParams({
          categoryId: 'c1',
          type: 'DESPESA',
          status: 'PENDENTE',
          search: 'luz',
          overdue: '1',
          sortBy: 'description',
          sortDir: 'desc',
        });

        expect(component.filterCategoryId()).toBe('c1');
        expect(component.filterType()).toBe('DESPESA');
        expect(component.filterStatus()).toBe('PENDENTE');
        expect(component.searchText()).toBe('luz');
        expect(component.filterOverdue()).toBeTrue();
        expect(component.sortColumn()).toBe('description');
        expect(component.sortDirection()).toBe('desc');
      });

      it('ignora valores inválidos na URL e usa os defaults', () => {
        setupWithQueryParams({ type: 'LIXO', sortBy: 'campo-invalido', sortDir: 'lateral' });

        expect(component.filterType()).toBe('TODOS');
        expect(component.sortColumn()).toBeNull();
        expect(component.sortDirection()).toBe('asc');
      });
    });

    describe('escrita na URL', () => {
      it('atualiza a URL quando um filtro muda', () => {
        const router = TestBed.inject(Router);
        spyOn(router, 'navigate');

        component.setFilterType('RECEITA');
        fixture.detectChanges();

        expect(router.navigate).toHaveBeenCalledWith(
          [],
          jasmine.objectContaining({
            queryParams: jasmine.objectContaining({ type: 'RECEITA' }),
            queryParamsHandling: 'merge',
          }),
        );
      });

      it('remove o param da URL quando o filtro volta pro default', () => {
        const router = TestBed.inject(Router);
        component.setFilterType('RECEITA');
        fixture.detectChanges();
        spyOn(router, 'navigate');

        component.setFilterType('TODOS');
        fixture.detectChanges();

        expect(router.navigate).toHaveBeenCalledWith(
          [],
          jasmine.objectContaining({
            queryParams: jasmine.objectContaining({ type: null }),
          }),
        );
      });

      // gap encontrado pelo /spec-verify: "Limpar filtros" só era testado no estado
      // dos signals, nunca que a limpeza também é escrita na URL.
      it('clearFilters() reflete na URL — todos os params voltam a null', () => {
        const router = TestBed.inject(Router);
        component.setFilterType('RECEITA');
        component.setFilterStatus('PAGO');
        component.setFilterCategory('c2');
        component.searchText.set('luz');
        component.toggleOverdue();
        component.setSort('description');
        fixture.detectChanges();
        spyOn(router, 'navigate');

        component.clearFilters();
        fixture.detectChanges();

        expect(router.navigate).toHaveBeenCalledWith(
          [],
          jasmine.objectContaining({
            queryParams: {
              categoryId: null,
              type: null,
              status: null,
              search: null,
              overdue: null,
              sortBy: null,
              sortDir: null,
            },
          }),
        );
      });
    });

    // gap: a leitura inicial e a escrita eram testadas separadamente, sem provar que
    // os mesmos nomes/formatos de query param usados na escrita são os que a leitura
    // espera de volta — o round-trip nunca era exercitado ponta a ponta.
    it('round-trip: os params escritos na URL restauram o mesmo estado numa nova instância', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      component.setFilterCategory('c1');
      component.setFilterType('DESPESA');
      component.setFilterStatus('PENDENTE');
      component.searchText.set('luz');
      component.toggleOverdue();
      component.setSort('description');
      fixture.detectChanges();

      const lastCall = (router.navigate as jasmine.Spy).calls.mostRecent();
      const writtenParams = lastCall.args[1].queryParams as Record<string, string | null>;

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [TransactionsComponent],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { queryParamMap: convertToParamMap(writtenParams as Record<string, string>) } },
          },
        ],
      });
      const restoredFixture = TestBed.createComponent(TransactionsComponent);
      const restored = restoredFixture.componentInstance;

      expect(restored.filterCategoryId()).toBe('c1');
      expect(restored.filterType()).toBe('DESPESA');
      expect(restored.filterStatus()).toBe('PENDENTE');
      expect(restored.searchText()).toBe('luz');
      expect(restored.filterOverdue()).toBeTrue();
      expect(restored.sortColumn()).toBe('description');
    });

    // gap: nenhum teste provava que trocar de mês preserva os filtros — verdade hoje
    // só porque o effect() de recarga só chama load(), mas sem regressão automatizada.
    it('trocar de mês/ano mantém os filtros ativos', () => {
      component.setFilterType('DESPESA');
      component.searchText.set('luz');
      component.setSort('description');

      const { month, year } = component.monthYear.selected();
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      component.monthYear.setMonthYear(nextMonth, nextYear);

      expect(component.filterType()).toBe('DESPESA');
      expect(component.searchText()).toBe('luz');
      expect(component.sortColumn()).toBe('description');
    });
  });

  describe('totais', () => {
    beforeEach(() => {
      component.transactions.set([
        tx({ id: '1', type: 'DESPESA', amountExpected: 500, amountPaid: 480, status: 'PAGO' }),
        tx({ id: '2', type: 'DESPESA', amountExpected: 200, amountPaid: null, status: 'PENDENTE' }),
        tx({
          id: '3',
          type: 'RECEITA',
          amountExpected: 3000,
          amountPaid: 3000,
          status: 'PAGO',
          category: receitaCategory,
        }),
      ]);
    });

    it('totalExpected soma só o previsto das despesas', () => {
      expect(component.totalExpected()).toBe(700);
    });

    it('totalPaid soma só as despesas pagas (ignora pendentes com amountPaid null)', () => {
      expect(component.totalPaid()).toBe(480);
    });

    it('totalIncomeExpected soma só o previsto das receitas', () => {
      expect(component.totalIncomeExpected()).toBe(3000);
    });

    it('totalIncomePaid soma só receitas pagas', () => {
      expect(component.totalIncomePaid()).toBe(3000);
    });
  });

  describe('togglePayment()', () => {
    it('marca como PAGO usando amountExpected quando o lançamento está PENDENTE', () => {
      component.togglePayment(tx({ id: '1', status: 'PENDENTE', amountExpected: 250 }));

      const req = httpMock.expectOne('/api/transactions/1/payment');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ amountPaid: 250 });
      req.flush(tx({ id: '1', status: 'PAGO', amountPaid: 250 }));

      httpMock.expectOne((r) => r.url === '/api/transactions').flush([]);
      expect(component.togglingId()).toBeNull();
    });

    it('marca como PENDENTE enviando amountPaid nulo quando o lançamento está PAGO', () => {
      component.togglePayment(tx({ id: '1', status: 'PAGO', amountPaid: 250 }));

      const req = httpMock.expectOne('/api/transactions/1/payment');
      expect(req.request.body).toEqual({ amountPaid: null });
      req.flush(tx({ id: '1', status: 'PENDENTE', amountPaid: null }));

      httpMock.expectOne((r) => r.url === '/api/transactions').flush([]);
    });

    it('desabilita a linha (togglingId) enquanto a requisição está em voo', () => {
      component.togglePayment(tx({ id: '1', status: 'PENDENTE' }));
      expect(component.togglingId()).toBe('1');

      const req = httpMock.expectOne('/api/transactions/1/payment');
      req.flush(tx({ id: '1', status: 'PAGO' }));
      httpMock.expectOne((r) => r.url === '/api/transactions').flush([]);

      expect(component.togglingId()).toBeNull();
    });

    it('em caso de erro, limpa togglingId e não recarrega a lista', () => {
      component.togglePayment(tx({ id: '1', status: 'PENDENTE' }));

      const req = httpMock.expectOne('/api/transactions/1/payment');
      req.flush('erro', { status: 500, statusText: 'Server Error' });

      expect(component.togglingId()).toBeNull();
      httpMock.expectNone((r) => r.url === '/api/transactions');
    });
  });

  describe('seleção múltipla e ação em lote', () => {
    beforeEach(() => {
      component.transactions.set([
        tx({ id: '1', status: 'PENDENTE', amountExpected: 100 }),
        tx({ id: '2', status: 'PENDENTE', amountExpected: 200 }),
      ]);
    });

    // achado do /code-review na PR #44: o fix do checkbox invisível (0x0px, CSS
    // appearance:none global) foi mergeado sem teste de regressão — standards.md
    // exige teste antes de mexer em código legado sem cobertura.
    //
    // Usa getComputedStyle (não offsetWidth/offsetHeight): a tabela desktop tem
    // "hidden md:block" e o viewport padrão do Karma/ChromeHeadless fica abaixo do
    // breakpoint md, então offsetWidth zeraria por causa do display:none responsivo,
    // não pela regra de appearance que é o que este teste precisa travar.
    it('os checkboxes de seleção têm appearance nativa, não appearance:none', () => {
      fixture.detectChanges();
      httpMock.expectOne((r) => r.url === '/api/transactions').flush([
        tx({ id: '1', status: 'PENDENTE' }),
      ]);
      fixture.detectChanges();

      const checkboxes: NodeListOf<HTMLInputElement> = fixture.nativeElement.querySelectorAll(
        'input[type="checkbox"]',
      );
      expect(checkboxes.length).toBeGreaterThan(0);
      checkboxes.forEach((checkbox) => {
        expect(getComputedStyle(checkbox).appearance).not.toBe('none');
      });
    });

    it('toggleSelect() adiciona e remove o id do conjunto selecionado', () => {
      component.toggleSelect('1');
      expect(component.isSelected('1')).toBeTrue();
      component.toggleSelect('1');
      expect(component.isSelected('1')).toBeFalse();
    });

    it('toggleSelectAll() seleciona todos os ids visíveis e, chamado de novo, desmarca todos', () => {
      component.toggleSelectAll();
      expect(component.selectedIds().size).toBe(2);
      component.toggleSelectAll();
      expect(component.selectedIds().size).toBe(0);
    });

    it('bulkUpdatePayment(true) marca cada id selecionado como pago, limpa a seleção e recarrega', () => {
      component.toggleSelect('1');
      component.toggleSelect('2');
      component.bulkUpdatePayment(true);

      const req1 = httpMock.expectOne('/api/transactions/1/payment');
      expect(req1.request.body).toEqual({ amountPaid: 100 });
      req1.flush(tx({ id: '1', status: 'PAGO', amountPaid: 100 }));

      const req2 = httpMock.expectOne('/api/transactions/2/payment');
      expect(req2.request.body).toEqual({ amountPaid: 200 });
      req2.flush(tx({ id: '2', status: 'PAGO', amountPaid: 200 }));

      httpMock.expectOne((r) => r.url === '/api/transactions').flush([]);

      expect(component.selectedIds().size).toBe(0);
    });

    it('uma falha entre várias no lote não impede as demais de serem atualizadas', () => {
      component.toggleSelect('1');
      component.toggleSelect('2');
      component.bulkUpdatePayment(true);

      httpMock
        .expectOne('/api/transactions/1/payment')
        .flush('erro', { status: 500, statusText: 'Server Error' });
      httpMock
        .expectOne('/api/transactions/2/payment')
        .flush(tx({ id: '2', status: 'PAGO', amountPaid: 200 }));

      httpMock.expectOne((r) => r.url === '/api/transactions').flush([]);

      expect(component.selectedIds().size).toBe(0);
    });
  });

  describe('exclusão com desfazer', () => {
    it('askDelete() mostra um toast com ação "Desfazer" e marca a linha como pendente de exclusão', () => {
      const toast = TestBed.inject(ToastService);
      spyOn(toast, 'actionable');

      component.askDelete('1');

      expect(component.pendingDeleteId()).toBe('1');
      expect(toast.actionable).toHaveBeenCalledWith(
        'Lançamento excluído.',
        'warning',
        jasmine.objectContaining({ label: 'Desfazer' }),
      );
    });

    it('undoDelete() dentro da janela cancela a exclusão — nenhuma chamada DELETE é feita', () => {
      jasmine.clock().install();
      try {
        component.askDelete('1');
        component.undoDelete();
        jasmine.clock().tick(4000);

        expect(component.pendingDeleteId()).toBeNull();
        httpMock.expectNone((r) => r.method === 'DELETE');
      } finally {
        jasmine.clock().uninstall();
      }
    });

    it('deixar o timer expirar sem desfazer exclui o lançamento de verdade', () => {
      jasmine.clock().install();
      try {
        component.askDelete('1');
        jasmine.clock().tick(4000);

        const req = httpMock.expectOne('/api/transactions/1');
        expect(req.request.method).toBe('DELETE');
        req.flush(null);

        httpMock.expectOne((r) => r.url === '/api/transactions').flush([]);
        expect(component.pendingDeleteId()).toBeNull();
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });

  describe('indicador de isOverride', () => {
    let httpMock: HttpTestingController;

    beforeEach(() => {
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('aparece quando a instância gerada por recorrente foi editada manualmente', () => {
      // dispara o effect() do construtor (load() inicial); só o flush aplica os dados
      // no signal transactions — loading() fica true até a resposta chegar, e a
      // tabela/cards ficam ocultos enquanto loading() for true
      fixture.detectChanges();
      httpMock
        .expectOne((r) => r.url === '/api/transactions')
        .flush([tx({ recurringId: 'r1', isOverride: true })]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[title="Editado manualmente"]')).not.toBeNull();
    });

    it('não aparece quando a instância do recorrente não foi editada', () => {
      fixture.detectChanges();
      httpMock
        .expectOne((r) => r.url === '/api/transactions')
        .flush([tx({ recurringId: 'r1', isOverride: false })]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('[title="Editado manualmente"]')).toBeNull();
    });
  });
});
