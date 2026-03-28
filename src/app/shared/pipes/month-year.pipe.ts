import { Pipe, PipeTransform } from '@angular/core';
import { MonthYear } from '../../core/services/month-year.service';

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

@Pipe({ name: 'monthYear', standalone: true })
export class MonthYearPipe implements PipeTransform {
  transform(value: MonthYear | null): string {
    if (!value) return '';
    return `${MONTHS[value.month - 1]} ${value.year}`;
  }
}
