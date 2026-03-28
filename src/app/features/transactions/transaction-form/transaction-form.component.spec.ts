import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TransactionFormComponent } from './transaction-form.component';

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
        referenceMonth: 3,
        referenceYear: 2026,
        amountExpected: 1800,
        amountPaid: null,
      });
      fixture.detectChanges();
      expect(component.formValid()).toBeTrue();
    });

    it('deve ser inválido com valor previsto zero', () => {
      component['model'].set({
        description: 'Aluguel',
        categoryId: 'cat-1',
        type: 'DESPESA',
        referenceMonth: 3,
        referenceYear: 2026,
        amountExpected: 0,
        amountPaid: null,
      });
      fixture.detectChanges();
      expect(component.formValid()).toBeFalse();
    });

    it('deve ser inválido sem descrição', () => {
      component['model'].set({
        description: '',
        categoryId: 'cat-1',
        type: 'DESPESA',
        referenceMonth: 3,
        referenceYear: 2026,
        amountExpected: 500,
        amountPaid: null,
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
});
