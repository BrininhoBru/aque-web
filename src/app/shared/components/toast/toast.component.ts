import { Component, inject } from '@angular/core';

import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [],
  template: `
    <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl min-w-72 max-w-sm animate-slide-in"
          [class]="toastClass(toast)"
        >
          <span class="text-lg">{{ toastIcon(toast.type) }}</span>
          <p class="text-sm font-medium flex-1">{{ toast.message }}</p>
          <button
            (click)="toastService.dismiss(toast.id)"
            class="text-current opacity-50 hover:opacity-100 transition-opacity text-lg leading-none"
          >
            ×
          </button>
        </div>
      }
    </div>

    <style>
      @keyframes slide-in {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      .animate-slide-in {
        animation: slide-in 0.25s ease;
      }
    </style>
  `,
})
export class ToastComponent {
  readonly toastService = inject(ToastService);

  toastClass(toast: Toast): string {
    const base = 'border ';
    const map: Record<string, string> = {
      success: base + 'bg-[#0d2018] border-[#22c55e33] text-[#4ade80]',
      error: base + 'bg-[#200d0d] border-[#ef444433] text-[#f87171]',
      warning: base + 'bg-[#1f1a09] border-[#f59e0b33] text-[#fbbf24]',
    };
    return map[toast.type] ?? map['success'];
  }

  toastIcon(type: string): string {
    const map: Record<string, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
    };
    return map[type] ?? '•';
  }
}
