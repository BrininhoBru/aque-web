import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, shareReplay } from 'rxjs/operators';
import { DashboardSummary, CategoryTotal, MonthEvolution, SplitResult } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/dashboard`;

  // SidebarComponent e DashboardComponent chamam getSummary independentemente pro
  // mesmo year/month (achado do /code-review, PR #43) — shareReplay com refCount
  // deduplica chamadas concorrentes sem manter cache permanente entre navegações
  // (o buffer é descartado quando o último subscriber sai).
  private readonly summaryCache = new Map<string, Observable<DashboardSummary>>();

  getSummary(year: number, month: number): Observable<DashboardSummary> {
    const key = `${year}-${month}`;
    let summary$ = this.summaryCache.get(key);
    if (!summary$) {
      summary$ = this.http.get<DashboardSummary>(`${this.base}/summary/${year}/${month}`).pipe(
        // shareReplay's refCount:true reset é guardado por !hasCompleted internamente
        // (rxjs/internal/operators/share.js) — como uma fonte que completa (toda
        // requisição HTTP) já seta hasCompleted=true antes do teardown do subscriber
        // rodar, o reset por refCount-zero nunca dispara sozinho aqui, e sem
        // finalize() a entrada vira cache permanente (confirmado lendo o share.js e
        // testando: sem isso, uma 2ª chamada sequencial não gera 2ª requisição HTTP).
        // finalize() evicta a chave assim que a requisição compartilhada termina
        // (sucesso ou erro), garantindo que só concorre entre chamadas simultâneas.
        finalize(() => this.summaryCache.delete(key)),
        shareReplay({ bufferSize: 1, refCount: true }),
      );
      this.summaryCache.set(key, summary$);
    }
    return summary$;
  }

  getByCategory(
    year: number,
    month: number,
    type?: 'RECEITA' | 'DESPESA',
  ): Observable<CategoryTotal[]> {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.http.get<CategoryTotal[]>(`${this.base}/by-category/${year}/${month}`, { params });
  }

  getEvolution(year: number): Observable<MonthEvolution[]> {
    return this.http.get<MonthEvolution[]>(`${this.base}/evolution/${year}`);
  }

  getSplit(year: number, month: number): Observable<SplitResult> {
    return this.http.get<SplitResult>(`${this.base}/split/${year}/${month}`);
  }
}
