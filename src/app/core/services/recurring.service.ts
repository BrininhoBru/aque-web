import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RecurringTransaction } from '../models';
import { environment } from '../../../environments/environment';

export interface RecurringPayload {
  description: string;
  categoryId: string;
  type: 'RECEITA' | 'DESPESA';
  defaultAmount: number;
  dueDay: number | null;
}

@Injectable({ providedIn: 'root' })
export class RecurringService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/recurring`;

  getAll(active?: boolean): Observable<RecurringTransaction[]> {
    const params = active !== undefined ? new HttpParams().set('active', active) : undefined;
    return this.http.get<RecurringTransaction[]>(this.base, { params });
  }

  create(data: RecurringPayload): Observable<RecurringTransaction> {
    return this.http.post<RecurringTransaction>(this.base, data);
  }

  update(id: string, data: Partial<RecurringPayload>): Observable<RecurringTransaction> {
    return this.http.put<RecurringTransaction>(`${this.base}/${id}`, data);
  }

  deactivate(id: string): Observable<RecurringTransaction> {
    return this.http.delete<RecurringTransaction>(`${this.base}/${id}`);
  }

  generate(year: number, month: number): Observable<string> {
    return this.http.post(`${this.base}/generate/${year}/${month}`, null, { responseType: 'text' });
  }
}
