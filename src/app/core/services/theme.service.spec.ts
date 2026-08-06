import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

const STORAGE_KEY = 'aque_theme';

function mockMatchMedia(matches: boolean): void {
  spyOn(window, 'matchMedia').and.returnValue({ matches } as MediaQueryList);
}

describe('ThemeService', () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('deve criar o serviço', () => {
    mockMatchMedia(false);
    TestBed.configureTestingModule({ providers: [ThemeService] });
    expect(TestBed.inject(ThemeService)).toBeTruthy();
  });

  describe('estado inicial', () => {
    it('deve usar o tema salvo no localStorage quando existe', () => {
      localStorage.setItem(STORAGE_KEY, 'dark');
      mockMatchMedia(false);
      TestBed.configureTestingModule({ providers: [ThemeService] });

      expect(TestBed.inject(ThemeService).dark()).toBeTrue();
    });

    it('deve cair pra preferência do sistema quando não há tema salvo', () => {
      mockMatchMedia(true);
      TestBed.configureTestingModule({ providers: [ThemeService] });

      expect(TestBed.inject(ThemeService).dark()).toBeTrue();
    });
  });

  describe('toggle()', () => {
    it('deve alternar o valor de dark()', () => {
      mockMatchMedia(false);
      TestBed.configureTestingModule({ providers: [ThemeService] });
      const service = TestBed.inject(ThemeService);

      expect(service.dark()).toBeFalse();
      service.toggle();
      expect(service.dark()).toBeTrue();
      service.toggle();
      expect(service.dark()).toBeFalse();
    });

    it('deve persistir a escolha no localStorage e refletir na classe do <html>', () => {
      mockMatchMedia(false);
      TestBed.configureTestingModule({ providers: [ThemeService] });
      const service = TestBed.inject(ThemeService);

      service.toggle();
      TestBed.flushEffects();

      expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBeTrue();
    });
  });
});
