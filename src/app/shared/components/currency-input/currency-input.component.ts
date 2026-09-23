import { Component, input, model } from '@angular/core';
import { FormValueControl, transformedValue } from '@angular/forms/signals';

const FORMATTER = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CENTS_PER_UNIT = 100;

/** Só os dígitos importam: os dois últimos são os centavos. */
function toAmount(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  // campo vazio grava null, nunca 0: "não pago" e "pago R$ 0,00" são estados diferentes
  // em amountPaid, e o botão de limpar do formulário de lançamento depende disso
  return digits === '' ? null : Number(digits) / CENTS_PER_UNIT;
}

function toDisplay(amount: number | null): string {
  return amount == null ? '' : FORMATTER.format(amount);
}

/**
 * Campo de valor em reais para Signal Forms.
 *
 * Implementa `FormValueControl`, então liga direto no `[formField]` como qualquer input
 * nativo — a diretiva cuida do two-way binding do valor e do relay de `disabled`/`required`.
 * Quem usa não precisa saber que por dentro o valor vira string.
 *
 * A máscara é de centavos fixos, padrão de caixa eletrônico: só dígitos entram, e os dois
 * últimos são sempre os centavos. Isso elimina a ambiguidade entre vírgula e ponto (não há
 * separador pra digitar) e, por ser `type="text"`, o valor não muda mais quando a roda do
 * mouse passa pelo campo focado.
 */
@Component({
  selector: 'app-currency-input',
  standalone: true,
  template: `
    <div class="ledger-input-group">
      <span class="ledger-input-group-prefix">R$</span>
      <input
        type="text"
        inputmode="decimal"
        [value]="raw()"
        [placeholder]="placeholder()"
        (input)="onInput($event)"
        (blur)="touched.set(true)"
      />
    </div>
  `,
})
export class CurrencyInputComponent implements FormValueControl<number | null> {
  readonly value = model.required<number | null>();

  /**
   * `blur` não borbulha, então o evento no input interno nunca chegaria ao host onde o
   * `[formField]` está. O contrato `FormUiControl` prevê esse caso: a diretiva mantém este
   * model em sincronia com o `touched()` do campo.
   */
  readonly touched = model(false);

  readonly placeholder = input('0,00');

  protected readonly raw = transformedValue(this.value, {
    parse: (typed: string) => ({ value: toAmount(typed) }),
    format: toDisplay,
  });

  protected onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const display = toDisplay(toAmount(input.value));

    // o transformedValue preserva o texto como digitado (pra não pular o cursor); a máscara
    // precisa do contrário, reescrever a cada tecla. Escrever no elemento além do binding é
    // necessário porque digitar algo que não muda o formatado — uma letra, um separador —
    // deixaria o binding igual e o caractere solto apareceria na tela
    this.raw.set(display);
    input.value = display;
  }
}
