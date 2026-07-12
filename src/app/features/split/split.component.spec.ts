import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { SplitComponent } from './split.component';

describe('SplitComponent', () => {
  let component: SplitComponent;
  let fixture: ComponentFixture<SplitComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SplitComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('deve criar o componente', () => {
    expect(component).toBeTruthy();
  });

  describe('totalPercentage()', () => {
    it('deve somar corretamente os percentuais', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 60 },
        { person: { id: '2', name: 'Esposa' }, percentage: 40 },
      ]);
      expect(component.totalPercentage()).toBe(100);
    });

    it('deve retornar 0 quando não há itens', () => {
      component['items'].set([]);
      expect(component.totalPercentage()).toBe(0);
    });
  });

  describe('totalValid()', () => {
    it('deve ser true quando soma é 100%', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 70 },
        { person: { id: '2', name: 'Esposa' }, percentage: 30 },
      ]);
      expect(component.totalValid()).toBeTrue();
    });

    it('deve ser false quando soma é diferente de 100%', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 60 },
        { person: { id: '2', name: 'Esposa' }, percentage: 30 },
      ]);
      expect(component.totalValid()).toBeFalse();
    });
  });

  describe('distributeEqually()', () => {
    it('deve distribuir 100% igualmente entre 2 pessoas', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 0 },
        { person: { id: '2', name: 'Esposa' }, percentage: 0 },
      ]);
      component.distributeEqually();
      const total = component.items().reduce((a, i) => a + i.percentage, 0);
      expect(total).toBe(100);
    });

    it('deve distribuir 100% igualmente entre 3 pessoas com resto na primeira', () => {
      component['items'].set([
        { person: { id: '1', name: 'A' }, percentage: 0 },
        { person: { id: '2', name: 'B' }, percentage: 0 },
        { person: { id: '3', name: 'C' }, percentage: 0 },
      ]);
      component.distributeEqually();
      const percentages = component.items().map((i) => i.percentage);
      const total = percentages.reduce((a, b) => a + b, 0);
      expect(total).toBe(100);
      // Primeiro recebe o resto (34, 33, 33)
      expect(percentages[0]).toBe(34);
      expect(percentages[1]).toBe(33);
      expect(percentages[2]).toBe(33);
    });
  });

  describe('updatePercentage()', () => {
    it('deve atualizar o percentual de uma pessoa específica', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 50 },
        { person: { id: '2', name: 'Esposa' }, percentage: 50 },
      ]);
      component.updatePercentage('1', '70');
      expect(component.items()[0].percentage).toBe(70);
      expect(component.items()[1].percentage).toBe(50);
    });
  });

  describe('save()', () => {
    it('não deve enviar pessoas com percentual 0 (backend rejeita percentage <= 0)', () => {
      component['items'].set([
        { person: { id: '1', name: 'Eu' }, percentage: 100 },
        { person: { id: '2', name: 'Esposa' }, percentage: 0 },
      ]);

      component.save();

      const req = httpMock.expectOne((r) => r.method === 'PUT' && r.url.startsWith('/api/split/'));
      expect(req.request.body.items).toEqual([{ personId: '1', percentage: 100 }]);
      req.flush({ id: '1', referenceMonth: 1, referenceYear: 2026, items: [] });
    });

    it('não deve salvar quando a soma dos percentuais não é 100%', () => {
      component['items'].set([{ person: { id: '1', name: 'Eu' }, percentage: 50 }]);

      component.save();

      expect(component.saving()).toBeFalse();
      httpMock.expectNone((r) => r.method === 'PUT');
    });
  });
});
