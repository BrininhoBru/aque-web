import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CommandPaletteComponent } from './command-palette.component';

function press(key: string, opts: Partial<KeyboardEventInit> = {}): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, ...opts }));
}

describe('CommandPaletteComponent', () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('não renderiza nada fechado', () => {
    expect(fixture.nativeElement.querySelector('.command-palette')).toBeNull();
  });

  it('Cmd+K abre a paleta', () => {
    press('k', { metaKey: true });
    fixture.detectChanges();
    expect(component.open()).toBeTrue();
    expect(fixture.nativeElement.querySelector('.command-palette')).not.toBeNull();
  });

  it('Ctrl+K abre a paleta', () => {
    press('k', { ctrlKey: true });
    fixture.detectChanges();
    expect(component.open()).toBeTrue();
  });

  // gap encontrado pelo /spec-verify: nenhum teste provava que digitação normal
  // num campo de formulário não é interceptada pelo listener global de teclado.
  describe('digitação normal não é interceptada (paleta fechada)', () => {
    it('teclas normais não abrem a paleta nem chamam preventDefault', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      try {
        const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
        const preventDefaultSpy = spyOn(event, 'preventDefault').and.callThrough();
        input.dispatchEvent(event);
        fixture.detectChanges();

        expect(component.open()).toBeFalse();
        expect(preventDefaultSpy).not.toHaveBeenCalled();
      } finally {
        document.body.removeChild(input);
      }
    });

    it('digitar num input real atualiza o valor normalmente, sem interferência do listener', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      try {
        input.value = 'texto normal';
        input.dispatchEvent(new Event('input'));
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
        fixture.detectChanges();

        expect(input.value).toBe('texto normal');
        expect(component.open()).toBeFalse();
      } finally {
        document.body.removeChild(input);
      }
    });
  });

  describe('com a paleta aberta', () => {
    beforeEach(() => {
      press('k', { metaKey: true });
      fixture.detectChanges();
    });

    it('Escape fecha a paleta sem navegar', () => {
      press('Escape');
      fixture.detectChanges();
      expect(component.open()).toBeFalse();
      // gap encontrado pelo /spec-verify: só se provava que fechava, nunca que
      // "sem navegar" — router.navigate não podia ter sido chamado nesse caminho.
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('digitar filtra a lista por label, case-insensitive', () => {
      component.setQuery('lança');
      expect(component.items().map((i) => i.label)).toEqual(['Lançamentos']);
    });

    it('ArrowDown/ArrowUp movem o item ativo sem passar dos limites', () => {
      const total = component.items().length;
      expect(component.activeIndex()).toBe(0);

      press('ArrowUp');
      expect(component.activeIndex()).toBe(0); // já no início, não passa de 0

      for (let i = 0; i < total + 2; i++) {
        press('ArrowDown');
      }
      expect(component.activeIndex()).toBe(total - 1); // não passa do último
    });

    it('Enter navega pro item ativo e fecha a paleta', () => {
      press('ArrowDown'); // vai pro segundo item (Lançamentos)
      const target = component.items()[1];

      press('Enter');

      expect(router.navigate).toHaveBeenCalledWith([target.path]);
      expect(component.open()).toBeFalse();
    });

    it('clicar num item navega e fecha a paleta', () => {
      const target = component.items()[2];
      component.selectItem(target);

      expect(router.navigate).toHaveBeenCalledWith([target.path]);
      expect(component.open()).toBeFalse();
    });
  });
});
