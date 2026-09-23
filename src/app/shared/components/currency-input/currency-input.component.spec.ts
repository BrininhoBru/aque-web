import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormField, form, min } from '@angular/forms/signals';
import { CurrencyInputComponent } from './currency-input.component';

function digitar(fixture: ComponentFixture<unknown>, texto: string): void {
  const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
  input.value = texto;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

function exibido(fixture: ComponentFixture<unknown>): string {
  return (fixture.nativeElement.querySelector('input') as HTMLInputElement).value;
}

@Component({
  standalone: true,
  imports: [FormField, CurrencyInputComponent],
  template: `<app-currency-input [formField]="valorForm.amount" />`,
})
class HostComponent {
  readonly model = signal<{ amount: number | null }>({ amount: null });
  readonly valorForm = form(this.model, (campo) => {
    min(campo.amount, 0.01, { message: 'Valor deve ser maior que zero' });
  });
}

describe('CurrencyInputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve manter o número no model e a string formatada na tela', () => {
    digitar(fixture, '123456');

    expect(host.model().amount).toBe(1234.56);
    expect(exibido(fixture)).toBe('1.234,56');
  });

  it('deve tratar os dois últimos dígitos como centavos enquanto o usuário digita', () => {
    digitar(fixture, '1');
    expect(exibido(fixture)).toBe('0,01');

    digitar(fixture, '12');
    expect(exibido(fixture)).toBe('0,12');

    digitar(fixture, '12345');
    expect(exibido(fixture)).toBe('123,45');
  });

  it('deve gravar null quando o campo é esvaziado, nunca zero', () => {
    // amountPaid distingue "não pago" (null) de "pago R$ 0,00" — se virasse 0, todo
    // lançamento limpo seria salvo como pago
    digitar(fixture, '5000');
    expect(host.model().amount).toBe(50);

    digitar(fixture, '');
    expect(host.model().amount).toBeNull();
  });

  it('deve chegar no mesmo número colando com vírgula, com ponto ou sem separador', () => {
    for (const colado of ['1.234,56', '1234,56', '1234.56']) {
      digitar(fixture, colado);
      expect(host.model().amount)
        .withContext(`colando "${colado}"`)
        .toBe(1234.56);
    }
  });

  it('deve ignorar letras e símbolos, considerando só os dígitos', () => {
    digitar(fixture, '12abc34');

    expect(host.model().amount).toBe(12.34);
    expect(exibido(fixture)).toBe('12,34');
  });

  it('deve exibir formatado um valor que já veio do model', () => {
    host.model.set({ amount: 1500 });
    fixture.detectChanges();

    expect(exibido(fixture)).toBe('1.500,00');
  });

  it('deve exibir vazio quando o model está null', () => {
    expect(exibido(fixture)).toBe('');
  });

  it('deve manter as validações do campo funcionando através do componente', () => {
    // é o que prova que o contrato FormValueControl está ligado de verdade: o `min`
    // registrado no form() precisa enxergar o valor que o componente escreveu
    digitar(fixture, '0');
    expect(host.valorForm.amount().valid()).toBeFalse();

    digitar(fixture, '100');
    expect(host.valorForm.amount().valid()).toBeTrue();
  });

  it('deve marcar o campo como touched ao perder o foco', () => {
    expect(host.valorForm.amount().touched()).toBeFalse();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(host.valorForm.amount().touched()).toBeTrue();
  });
});
