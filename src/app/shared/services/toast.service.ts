import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 0;

  success(message: string): void {
    this.add(message, 'success');
  }

  error(message: string): void {
    this.add(message, 'error');
  }

  warning(message: string): void {
    this.add(message, 'warning');
  }

  dismiss(id: number): void {
    this._toasts.update((t) => t.filter((toast) => toast.id !== id));
  }

  private add(message: string, type: ToastType): void {
    const id = this.nextId++;
    this._toasts.update((t) => [...t, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}
