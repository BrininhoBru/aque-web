import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AppShellComponent } from './app-shell.component';
import { press } from '../test-helpers';

describe('AppShellComponent', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppShellComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    // a sidebar não busca mais o summary desde a #48, que desativou o badge de vencidos —
    // o spec continuava esperando essa request e por isso falhava
    httpMock.verify();
  });

  // #57: o seletor de mês era `position: absolute` centrado na viewport, saía do fluxo do
  // flex e pintava por cima do toggle de tema — que ficava invisível e inclicável. Nenhum
  // teste do repo enxergava isso, porque o botão existia no DOM e estava "visível"
  it('deve manter o toggle de tema fora da área do seletor de mês', () => {
    const header: HTMLElement = fixture.nativeElement.querySelector('app-header');
    const toggle = Array.from(header.querySelectorAll<HTMLElement>('button.btn-nav')).find((b) =>
      (b.getAttribute('title') ?? '').startsWith('Modo'),
    );
    const month = header.querySelector<HTMLElement>('.header-month');

    expect(toggle).withContext('toggle de tema não encontrado no header').toBeTruthy();
    expect(month).withContext('seletor de mês não encontrado no header').toBeTruthy();

    const t = toggle!.getBoundingClientRect();
    const m = month!.getBoundingClientRect();
    const sobrepoe = t.left < m.right && t.right > m.left && t.top < m.bottom && t.bottom > m.top;

    expect(sobrepoe)
      .withContext(`toggle ${JSON.stringify(t.toJSON())} sobrepõe o mês ${JSON.stringify(m.toJSON())}`)
      .toBeFalse();
  });

  it('deve criar o shell com a paleta de comando montada', () => {
    expect(fixture.nativeElement.querySelector('app-command-palette')).not.toBeNull();
  });

  // gap encontrado pelo /spec-verify (spec #38): o critério "Cmd+K funciona em
  // qualquer tela autenticada" só era provado com o CommandPaletteComponent
  // isolado, nunca de dentro do AppShellComponent — que é o que efetivamente
  // envolve toda rota autenticada do app.
  it('Cmd+K abre a paleta de comando de dentro do shell autenticado', () => {
    expect(fixture.nativeElement.querySelector('.command-palette')).toBeNull();

    press('k', { metaKey: true });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.command-palette')).not.toBeNull();
  });
});
