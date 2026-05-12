import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from '../models';

export interface TransactionFilters {
  month?: number;
  year?: number;
  categoryId?: string;
  type?: 'RECEITA' | 'DESPESA';
  status?: 'PENDENTE' | 'PAGO';
}

export interface TransactionPayload {
  description: string;
  categoryId: string;
  type: 'RECEITA' | 'DESPESA';
  referenceMonth: number;
  referenceYear: number;
  amountExpected: number;
  amountPaid?: number | null;
  dueDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/transactions';

  getAll(filters?: TransactionFilters): Observable<Transaction[]> {
    let params = new HttpParams();
    if (filters?.month) params = params.set('month', filters.month);
    if (filters?.year) params = params.set('year', filters.year);
    if (filters?.categoryId) params = params.set('categoryId', filters.categoryId);
    if (filters?.type) params = params.set('type', filters.type);
    if (filters?.status) params = params.set('status', filters.status);
    return this.http.get<Transaction[]>(this.base, { params });
  }

  create(data: TransactionPayload): Observable<Transaction> {
    return this.http.post<Transaction>(this.base, data);
  }

  update(id: string, data: Partial<TransactionPayload>): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
