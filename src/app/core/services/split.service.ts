import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SplitRule } from '../models';

export interface SplitPayload {
  items: { personId: string; percentage: number }[];
}

@Injectable({ providedIn: 'root' })
export class SplitService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/split';

  getByMonth(year: number, month: number): Observable<SplitRule> {
    return this.http.get<SplitRule>(`${this.base}/${year}/${month}`);
  }

  save(year: number, month: number, data: SplitPayload): Observable<SplitRule> {
    return this.http.put<SplitRule>(`${this.base}/${year}/${month}`, data);
  }
}
