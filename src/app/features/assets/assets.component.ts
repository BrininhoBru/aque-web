import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, required, minLength, min } from '@angular/forms/signals';
import { NgApexchartsModule, ApexNonAxisChartSeries, ApexChart, ApexLegend, ApexTooltip, ApexDataLabels, ApexPlotOptions } from 'ng-apexcharts';
import { AssetService } from '../../core/services/asset.service';
import { PersonService } from '../../core/services/person.service';
import { ToastService } from '../../shared/services/toast.service';
import { Asset, AssetImportResult, AssetType, Person } from '../../core/models';
import { notBlank } from '../../shared/validators/not-blank.validator';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';
import { CurrencyInputComponent } from '../../shared/components/currency-input/currency-input.component';
import { chartTheme } from '../../shared/chart-theme';
import { ThemeService } from '../../core/services/theme.service';

interface AllocationChartOptions {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  legend: ApexLegend;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  colors: string[];
}

interface AssetModel {
  name: string;
  type: AssetType;
  currentValue: number;
  personId: string | null;
}

@Component({
  selector: 'app-assets',
  standalone: true,
  imports: [CommonModule, FormField, BrlCurrencyPipe, NgApexchartsModule, CurrencyInputComponent],
  templateUrl: './assets.component.html',
})
export class AssetsComponent implements OnInit {
  private readonly assetService = inject(AssetService);
  private readonly theme = inject(ThemeService);
  private readonly personService = inject(PersonService);
  private readonly toast = inject(ToastService);

  readonly assets = signal<Asset[]>([]);
  readonly persons = signal<Person[]>([]);
  readonly netWorth = signal(0);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly importing = signal(false);
  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly confirmDeleteId = signal<string | null>(null);
  readonly importResult = signal<AssetImportResult | null>(null);
  readonly viewMode = signal<'DASHBOARD' | 'RELATORIO'>('DASHBOARD');

  readonly assetTypes: { value: AssetType; label: string }[] = [
    { value: 'RENDA_FIXA', label: 'Renda Fixa' },
    { value: 'ACAO', label: 'Ação' },
    { value: 'FUNDO', label: 'Fundo' },
    { value: 'CRIPTO', label: 'Cripto' },
    { value: 'IMOVEL', label: 'Imóvel' },
    { value: 'OUTRO', label: 'Outro' },
  ];

  // Model signal — fonte de verdade do formulário
  private readonly model = signal<AssetModel>({
    name: '',
    type: 'ACAO',
    currentValue: 0,
    personId: null,
  });

  // Field tree com validações
  readonly assetForm = form(this.model, (f) => {
    required(f.name, { message: 'Nome obrigatório' });
    minLength(f.name, 2, { message: 'Mínimo 2 caracteres' });
    notBlank(f.name, { message: 'Nome não pode ser só espaços' });
    required(f.currentValue, { message: 'Valor atual obrigatório' });
    min(f.currentValue, 0, { message: 'Valor atual não pode ser negativo' });
  });

  // Validade geral do form
  readonly formValid = computed(
    () => this.assetForm.name().valid() && this.assetForm.currentValue().valid(),
  );

  // Erros de verdade (acionáveis) vs. linhas de rodapé/subtotal esperadas da B3
  // O backend marca a divergência de reconciliação com `row: 0` de propósito: linha de
  // dados usa rowIndex+1 (>= 2) e erro de cabeçalho usa 1, então 0 não colide. É um acordo
  // implícito entre os dois repos — o certo seria o AssetImportError dizer o que ele é
  // (ver "Questões em aberto" na spec 55)
  private static readonly RECONCILIATION_ROW = 0;

  readonly realErrors = computed(
    () =>
      this.importResult()?.errors.filter(
        (e) => !e.isInformational && e.row !== AssetsComponent.RECONCILIATION_ROW,
      ) ?? [],
  );

  readonly reconciliationWarnings = computed(
    () =>
      this.importResult()?.errors.filter(
        (e) => !e.isInformational && e.row === AssetsComponent.RECONCILIATION_ROW,
      ) ?? [],
  );

  readonly missingAssets = computed(() => this.importResult()?.missing ?? []);

  /**
   * Abas em que o lido não bate com o persistido — em import normal a lista é vazia.
   *
   * O `?.` em `sheets` não é redundante: o tipo promete o campo, mas quem responde é o
   * backend. Com uma versão anterior à #37 no ar — deploy fora de ordem, rollback só do
   * backend — o campo não vem e `undefined.filter` derruba o bloco inteiro do resultado.
   */
  readonly divergingSheets = computed(
    () => this.importResult()?.sheets?.filter((s) => s.totalRead !== s.totalPersisted) ?? [],
  );
  readonly informationalErrors = computed(() => this.importResult()?.errors.filter((e) => e.isInformational) ?? []);

  readonly allocationByType = computed(() => {
    const groups = new Map<AssetType, Asset[]>();
    for (const asset of this.assets()) {
      const group = groups.get(asset.type) ?? [];
      group.push(asset);
      groups.set(asset.type, group);
    }
    return this.assetTypes
      .filter((t) => groups.has(t.value))
      .map((t) => {
        const items = groups.get(t.value)!;
        return {
          type: t.value,
          label: t.label,
          items,
          total: items.reduce((sum, a) => sum + a.currentValue, 0),
        };
      });
  });

  readonly allocationChartOptions = computed<AllocationChartOptions>(() => {
    const theme = chartTheme(this.theme.dark());
    const items = this.allocationByType();

    return {
      series: items.map((i) => i.total),
      labels: items.map((i) => i.label),
      chart: {
        type: 'donut',
        height: 280,
        background: 'transparent',
        foreColor: theme.foreColor,
        fontFamily: 'system-ui, sans-serif',
        toolbar: { show: false },
        animations: { enabled: true, speed: 400 },
      },
      colors: theme.series,
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                color: theme.foreColor,
                fontSize: '12px',
                formatter: (w: { globals: { seriesTotals: number[] } }) => {
                  const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return 'R$ ' + total.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val.toFixed(1) + '%',
        style: { fontSize: '11px', fontFamily: 'system-ui, sans-serif' },
        dropShadow: { enabled: false },
      },
      legend: {
        position: 'bottom',
        fontSize: '12px',
        fontFamily: 'system-ui, sans-serif',
        labels: { colors: theme.foreColor },
        markers: { size: 6 },
        itemMargin: { horizontal: 8, vertical: 4 },
      },
      tooltip: {
        theme: theme.tooltipTheme,
        y: {
          formatter: (val: number) =>
            'R$ ' + val.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        },
      },
    };
  });

  ngOnInit(): void {
    this.load();
    this.loadNetWorth();
    this.personService.getAll().subscribe({
      next: (data) => this.persons.set(data),
      // errorInterceptor já loga/avisa o erro; precisa de um handler aqui só pra evitar
      // que o RxJS relance a HttpErrorResponse por falta de observer de erro.
      error: () => {},
    });
  }

  load(): void {
    this.loading.set(true);
    this.assetService.getAll().subscribe({
      next: (data) => {
        this.assets.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadNetWorth(): void {
    this.assetService.getNetWorth().subscribe({
      next: (summary) => this.netWorth.set(summary.totalValue),
      error: () => {},
    });
  }

  typeLabel(type: AssetType): string {
    return this.assetTypes.find((t) => t.value === type)?.label ?? type;
  }

  setViewMode(mode: 'DASHBOARD' | 'RELATORIO'): void {
    this.viewMode.set(mode);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.model.set({ name: '', type: 'ACAO', currentValue: 0, personId: null });
    this.showForm.set(true);
  }

  openEdit(asset: Asset): void {
    this.editingId.set(asset.id);
    this.model.set({
      name: asset.name,
      type: asset.type,
      currentValue: asset.currentValue,
      personId: asset.person?.id ?? null,
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  setType(type: AssetType): void {
    this.assetForm.type().value.set(type);
  }

  setPerson(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.assetForm.personId().value.set(value || null);
  }

  save(): void {
    if (!this.formValid() || this.saving()) return;
    this.saving.set(true);

    const { name, type, currentValue, personId } = this.model();
    const id = this.editingId();
    const payload = { name, type, currentValue, personId };

    const request$ = id
      ? this.assetService.update(id, payload)
      : this.assetService.create(payload);

    request$.subscribe({
      next: () => {
        this.toast.success(id ? 'Ativo atualizado!' : 'Ativo criado!');
        this.closeForm();
        this.load();
        this.loadNetWorth();
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  askDelete(id: string): void {
    this.confirmDeleteId.set(id);
  }
  cancelDelete(): void {
    this.confirmDeleteId.set(null);
  }

  confirmDelete(): void {
    const id = this.confirmDeleteId();
    if (!id) return;
    this.assetService.delete(id).subscribe({
      next: () => {
        this.toast.success('Ativo excluído.');
        this.confirmDeleteId.set(null);
        // o importResult é um retrato do import e não se atualiza com o load(); sem tirar
        // daqui, o ativo recém-excluído seguiria listado como ausente
        this.importResult.update((result) =>
          result ? { ...result, missing: result.missing.filter((a) => a.id !== id) } : result,
        );
        this.load();
        this.loadNetWorth();
      },
      error: () => this.confirmDeleteId.set(null),
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importing.set(true);
    this.importResult.set(null);

    this.assetService.importXlsx(file).subscribe({
      next: (result) => {
        this.importResult.set(result);
        this.toast.success(`${result.created.length} criado(s), ${result.updated.length} atualizado(s).`);
        this.load();
        this.loadNetWorth();
        this.importing.set(false);
        input.value = '';
      },
      error: () => {
        this.importing.set(false);
        input.value = '';
      },
    });
  }

  dismissImportResult(): void {
    this.importResult.set(null);
  }
}
