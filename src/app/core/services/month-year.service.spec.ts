import { TestBed } from '@angular/core/testing';
import { MonthYearService } from './month-year.service';

describe('MonthYearService', () => {
  let service: MonthYearService;
  const now = new Date();

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [MonthYearService] });
    service = TestBed.inject(MonthYearService);
  });

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  it('deve iniciar no mês e ano correntes', () => {
    expect(service.month()).toBe(now.getMonth() + 1);
    expect(service.year()).toBe(now.getFullYear());
  });

  describe('nextMonth()', () => {
    it('deve avançar para o próximo mês', () => {
      service.setMonthYear(3, 2026);
      service.nextMonth();
      expect(service.month()).toBe(4);
      expect(service.year()).toBe(2026);
    });

    it('deve virar o ano ao avançar de dezembro', () => {
      service.setMonthYear(12, 2025);
      service.nextMonth();
      expect(service.month()).toBe(1);
      expect(service.year()).toBe(2026);
    });
  });

  describe('previousMonth()', () => {
    it('deve voltar para o mês anterior', () => {
      service.setMonthYear(5, 2026);
      service.previousMonth();
      expect(service.month()).toBe(4);
      expect(service.year()).toBe(2026);
    });

    it('deve virar o ano ao voltar de janeiro', () => {
      service.setMonthYear(1, 2026);
      service.previousMonth();
      expect(service.month()).toBe(12);
      expect(service.year()).toBe(2025);
    });
  });

  describe('setMonthYear()', () => {
    it('deve definir mês e ano diretamente', () => {
      service.setMonthYear(7, 2030);
      expect(service.month()).toBe(7);
      expect(service.year()).toBe(2030);
    });
  });
});
