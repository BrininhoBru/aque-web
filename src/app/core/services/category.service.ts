import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Category } from '../models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/categories';

  getAll(type?: 'RECEITA' | 'DESPESA'): Observable<Category[]> {
    const params = type ? new HttpParams().set('type', type) : undefined;
    return this.http.get<Category[]>(this.base, { params });
  }

  create(data: { name: string; type: 'RECEITA' | 'DESPESA' }): Observable<Category> {
    return this.http.post<Category>(this.base, data);
  }

  update(id: string, data: { name: string; type?: 'RECEITA' | 'DESPESA' }): Observable<Category> {
    return this.http.put<Category>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
