import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { CommandPaletteComponent } from './command-palette.component';
import { press } from '../test-helpers';

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

  // achado do /code-review na PR #43: (metaKey||ctrlKey)+'k' não distinguia
  // Ctrl+Shift+K, sequestrando o atalho nativo do Firefox de abrir o Console.
  it('Ctrl+Shift+K não abre a paleta', () => {
    press('k', { ctrlKey: true, shiftKey: true });
    fixture.detectChanges();
    expect(component.open()).toBeFalse();
  });

  it('Cmd+Alt+K não abre a paleta', () => {
    press('k', { metaKey: true, altKey: true });
    fixture.detectChanges();
    expect(component.open()).toBeFalse();
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

  // achado do /code-review na PR #43: overlay sem role/aria-modal, sem devolver o
  // foco ao elemento anterior ao fechar, sem focus trap.
  describe('acessibilidade', () => {
    it('o painel tem role="dialog" e aria-modal="true"', () => {
      press('k', { metaKey: true });
      fixture.detectChanges();

      const panel: HTMLElement = fixture.nativeElement.querySelector('.command-palette');
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(panel.getAttribute('aria-modal')).toBe('true');
    });

    it('devolve o foco ao elemento anterior quando fecha com Escape', () => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      try {
        press('k', { metaKey: true });
        fixture.detectChanges();
        expect(document.activeElement).not.toBe(trigger);

        press('Escape');
        fixture.detectChanges();

        expect(document.activeElement).toBe(trigger);
      } finally {
        document.body.removeChild(trigger);
      }
    });

    it('devolve o foco ao elemento anterior quando fecha selecionando um item', () => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      try {
        press('k', { metaKey: true });
        fixture.detectChanges();

        component.selectItem(component.items()[0]);
        fixture.detectChanges();

        expect(document.activeElement).toBe(trigger);
      } finally {
        document.body.removeChild(trigger);
      }
    });

    it('Tab não escapa a paleta — mantém o foco no input de busca', () => {
      press('k', { metaKey: true });
      fixture.detectChanges();

      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
      const preventDefaultSpy = spyOn(tabEvent, 'preventDefault').and.callThrough();
      window.dispatchEvent(tabEvent);
      fixture.detectChanges();

      expect(preventDefaultSpy).toHaveBeenCalled();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('.command-palette-input');
      expect(document.activeElement).toBe(input);
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

    // achado do /code-review na PR #43: apertar Cmd/Ctrl+K de novo com a paleta já
    // aberta rodava openPalette() incondicionalmente, zerando query/activeIndex em
    // progresso.
    it('apertar Cmd+K de novo com a paleta já aberta não reseta a busca em progresso', () => {
      component.setQuery('cat');
      press('k', { metaKey: true });
      fixture.detectChanges();

      expect(component.open()).toBeTrue();
      expect(component.query()).toBe('cat');
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
