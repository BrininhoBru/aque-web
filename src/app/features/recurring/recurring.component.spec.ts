import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
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
    ...overrides,
  };
}

describe('RecurringComponent', () => {
  let component: RecurringComponent;
  let fixture: ComponentFixture<RecurringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecurringComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RecurringComponent);
    component = fixture.componentInstance;
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
});
