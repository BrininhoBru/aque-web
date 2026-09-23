import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AssetsComponent } from './assets.component';
import { Asset, AssetImportResult } from '../../core/models';
import { ThemeService } from '../../core/services/theme.service';

describe('AssetsComponent', () => {
  let component: AssetsComponent;
  let fixture: ComponentFixture<AssetsComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssetsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AssetsComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/assets').flush([]);
    http.expectOne('/api/assets/net-worth').flush({ totalValue: 0 });
    http.expectOne('/api/persons').flush([]);
  });

  afterEach(() => http.verify());

  it('deve repintar o gráfico de alocação quando o tema muda', () => {
    const theme = TestBed.inject(ThemeService);
    theme.dark.set(false);
    const claro = component.allocationChartOptions();

    theme.dark.set(true);
    const escuro = component.allocationChartOptions();

    expect(escuro.colors).not.toEqual(claro.colors);
    expect(escuro.chart.foreColor).not.toEqual(claro.chart.foreColor);
    expect(escuro.tooltip.theme).toBe('dark');
  });

  it('marca inválido quando o nome é só espaços em branco', () => {
    component.assetForm.name().value.set('   ');
    expect(component.assetForm.name().valid()).toBeFalse();
  });

  it('mantém válido com um nome de verdade e valor não negativo', () => {
    component.assetForm.name().value.set('VALE3');
    component.assetForm.currentValue().value.set(314.48);
    expect(component.formValid()).toBeTrue();
  });

  it('marca inválido quando o valor atual é negativo', () => {
    component.assetForm.name().value.set('VALE3');
    component.assetForm.currentValue().value.set(-1);
    expect(component.formValid()).toBeFalse();
  });

  it('separa erros informativos de erros reais no resultado do import', () => {
    const result: AssetImportResult = {
      created: [],
      updated: [],
      missing: [],
      sheets: [],
      totalRead: 0,
      totalPersisted: 0,
      errors: [
        { sheet: 'Acoes', row: 3, message: 'Produto vazio (possível linha de total/rodapé)', isInformational: true },
        { sheet: 'Renda Fixa', row: 5, message: 'Valor atualizado indisponível', isInformational: false },
      ],
    };
    component.importResult.set(result);

    expect(component.realErrors()).toEqual([result.errors[1]]);
    expect(component.informationalErrors()).toEqual([result.errors[0]]);
  });

  it('agrupa o patrimônio por tipo somando o valor de cada ativo', () => {
    const assets: Asset[] = [
      { id: '1', name: 'VALE3', type: 'ACAO', currentValue: 100, externalCode: 'VALE3', person: null },
      { id: '2', name: 'BTCI11', type: 'FUNDO', currentValue: 50, externalCode: 'BTCI11', person: null },
      { id: '3', name: 'PETR4', type: 'ACAO', currentValue: 200, externalCode: 'PETR4', person: null },
    ];
    component.assets.set(assets);

    const allocation = component.allocationByType();
    expect(allocation.find((a) => a.type === 'ACAO')?.total).toBe(300);
    expect(allocation.find((a) => a.type === 'FUNDO')?.total).toBe(50);
    expect(allocation.length).toBe(2);
    expect(allocation.find((a) => a.type === 'ACAO')?.items).toEqual([assets[0], assets[2]]);
    expect(allocation.find((a) => a.type === 'FUNDO')?.items).toEqual([assets[1]]);
  });

  describe('resultado do import', () => {
    function ativo(overrides: Partial<Asset>): Asset {
      return {
        id: 'id-1',
        name: 'XPTO3 - XPTO S.A.',
        type: 'ACAO',
        currentValue: 290.2,
        externalCode: 'XPTO3',
        person: null,
        ...overrides,
      };
    }

    function resultado(overrides: Partial<AssetImportResult>): AssetImportResult {
      return {
        created: [],
        updated: [],
        missing: [],
        errors: [],
        sheets: [],
        totalRead: 0,
        totalPersisted: 0,
        ...overrides,
      };
    }

    it('deve separar divergência de reconciliação dos itens não importados', () => {
      // o backend marca a divergência com row 0 de propósito; se ela cair no mesmo balde
      // das linhas que falharam, o cabeçalho conta errado e mostra "(linha 0)"
      component.importResult.set(
        resultado({
          errors: [
            { sheet: 'Acoes', row: 3, message: 'Valor atualizado indisponível', isInformational: false },
            { sheet: 'Renda Fixa', row: 0, message: 'Total persistido diverge do total lido', isInformational: false },
            { sheet: 'Acoes', row: 5, message: 'Produto vazio', isInformational: true },
          ],
        }),
      );

      expect(component.realErrors().length).toBe(1);
      expect(component.realErrors()[0].row).toBe(3);
      expect(component.reconciliationWarnings().length).toBe(1);
      expect(component.reconciliationWarnings()[0].sheet).toBe('Renda Fixa');
      expect(component.informationalErrors().length).toBe(1);
    });

    it('deve listar os ativos ausentes do arquivo', () => {
      component.importResult.set({
        ...resultado({}),
        missing: [ativo({ id: 'a1' }), ativo({ id: 'a2', name: 'XPTO4 - XPTO PART S.A.' })],
      });
      fixture.detectChanges();

      const texto: string = fixture.nativeElement.textContent;
      expect(component.missingAssets().length).toBe(2);
      expect(texto).toContain('XPTO4 - XPTO PART S.A.');
    });

    it('deve tirar o ativo da lista de ausentes ao excluí-lo', () => {
      component.importResult.set({ ...resultado({}), missing: [ativo({ id: 'a1' }), ativo({ id: 'a2' })] });

      component.askDelete('a1');
      component.confirmDelete();
      http.expectOne('/api/assets/a1').flush(null);
      http.expectOne('/api/assets').flush([]);
      http.expectOne('/api/assets/net-worth').flush({ totalValue: 0 });

      expect(component.missingAssets().map((a) => a.id)).toEqual(['a2']);
    });

    it('não deve mostrar a reconciliação quando todas as abas fecham', () => {
      component.importResult.set(
        resultado({
          sheets: [{ sheet: 'Acoes', rows: 2, totalRead: 400, totalPersisted: 400 }],
          totalRead: 400,
          totalPersisted: 400,
        }),
      );

      expect(component.divergingSheets().length).toBe(0);
    });

    it('deve mostrar apenas as abas que divergem', () => {
      component.importResult.set(
        resultado({
          sheets: [
            { sheet: 'Acoes', rows: 2, totalRead: 400, totalPersisted: 400 },
            { sheet: 'Renda Fixa', rows: 2, totalRead: 3500, totalPersisted: 2500 },
          ],
        }),
      );

      expect(component.divergingSheets().map((s) => s.sheet)).toEqual(['Renda Fixa']);
    });
  });
});
