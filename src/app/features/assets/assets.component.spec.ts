import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AssetsComponent } from './assets.component';
import { Asset, AssetImportResult } from '../../core/models';

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
      errors: [
        { sheet: 'Acoes', row: 3, message: 'Produto vazio (possível linha de total/rodapé)', informational: true },
        { sheet: 'Renda Fixa', row: 5, message: 'Valor atualizado indisponível', informational: false },
      ],
    };
    component.importResult.set(result);

    expect(component.realErrors()).toEqual([result.errors[1]]);
    expect(component.informationalErrors()).toEqual([result.errors[0]]);
  });

  it('agrupa o patrimônio por tipo somando o valor de cada ativo', () => {
    const assets: Asset[] = [
      { id: '1', name: 'VALE3', type: 'ACAO', currentValue: 100, person: null },
      { id: '2', name: 'BTCI11', type: 'FUNDO', currentValue: 50, person: null },
      { id: '3', name: 'PETR4', type: 'ACAO', currentValue: 200, person: null },
    ];
    component.assets.set(assets);

    const allocation = component.allocationByType();
    expect(allocation.find((a) => a.type === 'ACAO')?.total).toBe(300);
    expect(allocation.find((a) => a.type === 'FUNDO')?.total).toBe(50);
    expect(allocation.length).toBe(2);
    expect(allocation.find((a) => a.type === 'ACAO')?.items).toEqual([assets[0], assets[2]]);
    expect(allocation.find((a) => a.type === 'FUNDO')?.items).toEqual([assets[1]]);
  });
});
