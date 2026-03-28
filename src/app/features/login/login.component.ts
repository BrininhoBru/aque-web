import { Component, inject, signal } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [],
  template: `
    <div
      class="min-h-screen flex items-center justify-center p-4"
      style="background: var(--color-bg);"
    >
      <!-- Glow de fundo -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2
                    w-96 h-96 rounded-full opacity-10 blur-3xl"
          style="background: radial-gradient(circle, var(--color-primary), transparent);"
        ></div>
      </div>

      <div class="relative w-full max-w-sm">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div
            class="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4"
            style="background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path
                d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"
              />
            </svg>
          </div>
          <h1
            style="font-family: var(--font-display); font-size: 2rem; font-weight: 800;
                     color: #f1f5f9; letter-spacing: -0.04em; line-height: 1;"
          >
            aque
          </h1>
          <p style="color: #475569; font-size: 0.875rem; margin-top: 0.35rem;">finanças pessoais</p>
        </div>

        <!-- Card -->
        <div class="card-glass p-8">
          <h2
            style="font-family: var(--font-display); font-size: 1.1rem; font-weight: 700;
                     color: #f1f5f9; margin-bottom: 1.5rem; letter-spacing: -0.02em;"
          >
            Entrar na conta
          </h2>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            <div>
              <label class="label">Usuário</label>
              <input
                class="input"
                type="text"
                formControlName="username"
                placeholder="seu usuário"
                autocomplete="username"
              />
              @if (form.get('username')?.invalid && form.get('username')?.touched) {
                <p class="text-xs mt-1" style="color: var(--color-danger);">Usuário obrigatório</p>
              }
            </div>

            <div>
              <label class="label">Senha</label>
              <input
                class="input"
                type="password"
                formControlName="password"
                placeholder="••••••••"
                autocomplete="current-password"
              />
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="text-xs mt-1" style="color: var(--color-danger);">Senha obrigatória</p>
              }
            </div>

            <!-- Erro de login -->
            @if (errorMessage()) {
              <div
                class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm"
                style="background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
                          color: var(--color-danger);"
              >
                <span>✕</span>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <button
              class="btn-primary w-full mt-2 py-2.5"
              type="submit"
              [disabled]="form.invalid || loading()"
            >
              @if (loading()) {
                <span class="loader"></span>
                Entrando...
              } @else {
                Entrar
              }
            </button>
          </form>
        </div>
      </div>
    </div>

    <style>
      .loader {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = new FormGroup({
    username: new FormControl('', { validators: [Validators.required] }),
    password: new FormControl('', { validators: [Validators.required] }),
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const { username, password } = this.form.value;

    this.auth.login(username!, password!).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.errorMessage.set('Usuário ou senha inválidos.');
        this.loading.set(false);
      },
    });
  }
}
