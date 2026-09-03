import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RecurringComponent } from './recurring.component';
import { RecurringTransaction, Category } from '../../core/models';

const despesaCategory: Category = { id: 'c1', name: 'Aluguel', type: 'DESPESA', predefined: false };
const receitaCategory: Category = { id: 'c2', name: 'Salário', type: 'RECEITA', predefined: false };

function recurring(overrides: Partial<RecurringTransaction>): RecurringTransaction {
  return {
    id: '1',
    description: 'Aluguel',
    category: despesaCategory,
    type: 'DESPESA',
    defaultAmount: 1500,
    active: true,
    dueDay: null,
    ...overrides,
  };
}

describe('RecurringComponent', () => {
  let component: RecurringComponent;
  let fixture: ComponentFixture<RecurringComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurringComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecurringComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('filtered()', () => {
    beforeEach(() => {
      component.recurrings.set([
        recurring({ id: '1', active: true }),
        recurring({ id: '2', active: false }),
      ]);
    });

    it('filtro padrão (ATIVOS) mostra só os ativos', () => {
      expect(component.filtered().map((r) => r.id)).toEqual(['1']);
    });

    it('INATIVOS mostra só os inativos', () => {
      component.setFilter('INATIVOS');
      expect(component.filtered().map((r) => r.id)).toEqual(['2']);
    });

    it('TODOS mostra os dois', () => {
      component.setFilter('TODOS');
      expect(component.filtered().length).toBe(2);
    });
  });

  describe('busca por texto (searchText)', () => {
    beforeEach(() => {
      component.recurrings.set([
        recurring({ id: '1', description: 'Aluguel', active: true }),
        recurring({ id: '2', description: 'Internet', active: true }),
      ]);
    });

    it('filtra por descrição, case-insensitive', () => {
      component.searchText.set('aluguel');
      expect(component.filtered().map((r) => r.id)).toEqual(['1']);
    });

    it('combina com o filtro de ativo/inativo já existente', () => {
      component.recurrings.set([
        recurring({ id: '1', description: 'Aluguel', active: false }),
        recurring({ id: '2', description: 'Aluguel', active: true }),
      ]);
      component.searchText.set('aluguel');
      expect(component.filtered().map((r) => r.id)).toEqual(['2']);
    });
  });

  describe('ordenação de colunas (setSort)', () => {
    it('ordena por descrição, ascendente', () => {
      component.recurrings.set([
        recurring({ id: '1', description: 'Internet' }),
        recurring({ id: '2', description: 'Aluguel' }),
      ]);
      component.setSort('description');
      expect(component.filtered().map((r) => r.id)).toEqual(['2', '1']);
    });

    it('clicar na mesma coluna de novo inverte a direção', () => {
      component.recurrings.set([
        recurring({ id: '1', description: 'Internet' }),
        recurring({ id: '2', description: 'Aluguel' }),
      ]);
      component.setSort('description');
      component.setSort('description');
      expect(component.filtered().map((r) => r.id)).toEqual(['1', '2']);
    });

    it('trocar de coluna volta a ordenar ascendente', () => {
      component.recurrings.set([
        recurring({ id: '1', description: 'Internet', defaultAmount: 100 }),
        recurring({ id: '2', description: 'Aluguel', defaultAmount: 300 }),
      ]);
      component.setSort('description');
      component.setSort('description'); // desc: ['1', '2']
      component.setSort('defaultAmount'); // troca de coluna: volta pra asc
      expect(component.filtered().map((r) => r.id)).toEqual(['1', '2']);
    });

    it('ordena por categoria (nome)', () => {
      component.recurrings.set([
        recurring({ id: '1', category: receitaCategory }), // Salário
        recurring({ id: '2', category: despesaCategory }), // Aluguel
      ]);
      component.setSort('category');
      expect(component.filtered().map((r) => r.id)).toEqual(['2', '1']);
    });

    it('ordena por tipo', () => {
      component.recurrings.set([
        recurring({ id: '1', type: 'RECEITA' }),
        recurring({ id: '2', type: 'DESPESA' }),
      ]);
      component.setSort('type');
      expect(component.filtered().map((r) => r.id)).toEqual(['2', '1']);
    });

    it('ordena por valor padrão numericamente', () => {
      component.recurrings.set([
        recurring({ id: '1', defaultAmount: 300 }),
        recurring({ id: '2', defaultAmount: 100 }),
        recurring({ id: '3', defaultAmount: 200 }),
      ]);
      component.setSort('defaultAmount');
      expect(component.filtered().map((r) => r.id)).toEqual(['2', '3', '1']);
    });
  });

  describe('categoriesByType()', () => {
    beforeEach(() => {
      component.categories.set([despesaCategory, receitaCategory]);
    });

    it('mostra só categorias do tipo selecionado no form (default DESPESA)', () => {
      expect(component.categoriesByType()).toEqual([despesaCategory]);
    });

    it('setType() troca o filtro e limpa a categoria selecionada', () => {
      component.recurringForm.categoryId().value.set(despesaCategory.id);
      component.setType('RECEITA');
      expect(component.categoriesByType()).toEqual([receitaCategory]);
      expect(component.recurringForm.categoryId().value()).toBe('');
    });
  });

  describe('formValid()', () => {
    it('é inválido com o form em branco (estado inicial)', () => {
      expect(component.formValid()).toBeFalse();
    });

    it('é válido com todos os campos obrigatórios preenchidos', () => {
      component.recurringForm.description().value.set('Aluguel');
      component.recurringForm.categoryId().value.set(despesaCategory.id);
      component.recurringForm.defaultAmount().value.set(1500);
      expect(component.formValid()).toBeTrue();
    });

    it('é inválido com valor <= 0', () => {
      component.recurringForm.description().value.set('Aluguel');
      component.recurringForm.categoryId().value.set(despesaCategory.id);
      component.recurringForm.defaultAmount().value.set(0);
      expect(component.formValid()).toBeFalse();
    });
  });

  describe('openEdit() / openCreate()', () => {
    it('openEdit() carrega os dados do recorrente no form e marca editingId', () => {
      component.openEdit(recurring({ id: '42', description: 'Internet', defaultAmount: 120 }));

      expect(component.editingId()).toBe('42');
      expect(component.showForm()).toBeTrue();
      expect(component.recurringForm.description().value()).toBe('Internet');
      expect(component.recurringForm.defaultAmount().value()).toBe(120);
    });

    it('openCreate() limpa o form e o editingId', () => {
      component.openEdit(recurring({ id: '42' }));
      component.openCreate();

      expect(component.editingId()).toBeNull();
      expect(component.recurringForm.description().value()).toBe('');
    });
  });

  describe('dueDay', () => {
    it('openEdit() carrega o dueDay do recorrente quando presente', () => {
      component.openEdit(recurring({ id: '42', dueDay: 15 }));
      expect(component.recurringForm.dueDay().value()).toBe(15);
    });

    it('openEdit() carrega null quando o recorrente não tem dueDay', () => {
      component.openEdit(recurring({ id: '42', dueDay: null }));
      expect(component.recurringForm.dueDay().value()).toBeNull();
    });

    it('openCreate() reseta o dueDay para null', () => {
      component.openEdit(recurring({ id: '42', dueDay: 15 }));
      component.openCreate();
      expect(component.recurringForm.dueDay().value()).toBeNull();
    });

    it('rejeita valor fora de 1-31', () => {
      component.recurringForm.description().value.set('Aluguel');
      component.recurringForm.categoryId().value.set(despesaCategory.id);
      component.recurringForm.defaultAmount().value.set(1500);
      component.recurringForm.dueDay().value.set(32);
      expect(component.formValid()).toBeFalse();

      component.recurringForm.dueDay().value.set(0);
      expect(component.formValid()).toBeFalse();

      component.recurringForm.dueDay().value.set(15);
      expect(component.formValid()).toBeTrue();
    });

    it('save() envia o dueDay no payload', () => {
      component.recurringForm.description().value.set('Aluguel');
      component.recurringForm.categoryId().value.set(despesaCategory.id);
      component.recurringForm.defaultAmount().value.set(1500);
      component.recurringForm.dueDay().value.set(5);

      component.save();

      const req = httpMock.expectOne('/api/recurring');
      expect(req.request.body.dueDay).toBe(5);
      req.flush(recurring({ dueDay: 5 }));
    });
  });
});
