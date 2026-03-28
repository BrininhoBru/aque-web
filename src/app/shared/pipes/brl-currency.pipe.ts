import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'brlCurrency', standalone: true })
export class BrlCurrencyPipe implements PipeTransform {
  private readonly formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  transform(value: number | null | undefined): string {
    if (value == null) return 'R$ —';
    return this.formatter.format(value);
  }
}
