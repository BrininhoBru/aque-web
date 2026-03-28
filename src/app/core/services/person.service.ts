import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Person } from '../models';

@Injectable({ providedIn: 'root' })
export class PersonService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/persons';

  getAll(): Observable<Person[]> {
    return this.http.get<Person[]>(this.base);
  }

  create(data: { name: string }): Observable<Person> {
    return this.http.post<Person>(this.base, data);
  }

  update(id: string, data: { name: string }): Observable<Person> {
    return this.http.put<Person>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
