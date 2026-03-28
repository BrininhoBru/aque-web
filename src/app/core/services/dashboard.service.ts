import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardSummary, CategoryTotal, MonthEvolution, SplitResult } from '../models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/dashboard';

  getSummary(year: number, month: number): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/summary/${year}/${month}`);
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
