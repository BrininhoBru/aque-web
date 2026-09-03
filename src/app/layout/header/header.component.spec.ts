import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';
import { MonthYearService } from '../../core/services/month-year.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let monthYear: MonthYearService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    monthYear = TestBed.inject(MonthYearService);
    fixture.detectChanges();
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  it('deve exibir o mês/ano selecionado no input no formato YYYY-MM', () => {
    monthYear.setMonthYear(3, 2026);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="month"]');
    expect(input.value).toBe('2026-03');
  });

  it('deve chamar setMonthYear com o mês e o ano corretos ao mudar o input', () => {
    spyOn(monthYear, 'setMonthYear');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[type="month"]');

    input.value = '2025-11';
    input.dispatchEvent(new Event('change'));

    expect(monthYear.setMonthYear).toHaveBeenCalledWith(11, 2025);
  });

  it('deve esconder o botão Hoje quando o mês selecionado é o mês atual', () => {
    const now = new Date();
    monthYear.setMonthYear(now.getMonth() + 1, now.getFullYear());
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.btn-today')).toBeNull();
  });

  it('deve mostrar o botão Hoje e voltar pro mês atual ao clicar quando o mês selecionado é diferente do atual', () => {
    const now = new Date();
    monthYear.setMonthYear(1, now.getFullYear() - 1);
    fixture.detectChanges();

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-today');
    expect(button).not.toBeNull();

    button.click();
    fixture.detectChanges();

    expect(monthYear.month()).toBe(now.getMonth() + 1);
    expect(monthYear.year()).toBe(now.getFullYear());
  });
});
