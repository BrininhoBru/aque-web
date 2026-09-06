import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asset, AssetImportResult, AssetType, NetWorthSummary } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AssetService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/assets`;

  getAll(personId?: string): Observable<Asset[]> {
    const params = personId ? new HttpParams().set('personId', personId) : undefined;
    return this.http.get<Asset[]>(this.base, { params });
  }

  getNetWorth(): Observable<NetWorthSummary> {
    return this.http.get<NetWorthSummary>(`${this.base}/net-worth`);
  }

  create(data: {
    name: string;
    type: AssetType;
    currentValue: number;
    personId: string | null;
  }): Observable<Asset> {
    return this.http.post<Asset>(this.base, data);
  }

  update(
    id: string,
    data: { name: string; type: AssetType; currentValue: number; personId: string | null },
  ): Observable<Asset> {
    return this.http.put<Asset>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  importXlsx(file: File): Observable<AssetImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AssetImportResult>(`${this.base}/import`, formData);
  }
}
