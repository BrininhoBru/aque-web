import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { form, FormField, required } from '@angular/forms/signals';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormField],
  template: `
    <div class="login-page">
      <!-- Logo -->
      <div class="login-brand">
        <div class="login-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
          </svg>
        </div>
        <h1 class="login-title">Aque</h1>
        <p class="login-subtitle">finanças pessoais</p>
      </div>

      <!-- Card -->
      <div class="ledger-card login-card">
        <div class="ledger-card-header">
          <h2 class="ledger-h2">Entrar na conta</h2>
        </div>

        <form (submit)="$event.preventDefault(); onSubmit()" class="ledger-card-body login-form">
          <div class="ledger-form-group">
            <label class="ledger-label">Usuário</label>
            <input
              class="ledger-input"
              type="text"
              [formField]="loginForm.username"
              placeholder="seu usuário"
              autocomplete="username"
            />
            @if (loginForm.username().touched() && loginForm.username().invalid()) {
              <p class="ledger-error">{{ loginForm.username().errors()[0]?.message }}</p>
            }
          </div>

          <div class="ledger-form-group">
            <label class="ledger-label">Senha</label>
            <input
              class="ledger-input"
              type="password"
              [formField]="loginForm.password"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            @if (loginForm.password().touched() && loginForm.password().invalid()) {
              <p class="ledger-error">{{ loginForm.password().errors()[0]?.message }}</p>
            }
          </div>

          @if (errorMessage()) {
            <div class="login-error">
              <span>✕</span>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <button class="btn-primary login-submit" type="submit" [disabled]="!formValid() || loading()">
            @if (loading()) { <span class="loader"></span> Entrando... }
            @else { Entrar }
          </button>
        </form>
      </div>
    </div>

    <style>
      .login-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
        background: var(--color-ledger-page);
      }
      .login-brand {
        text-align: center;
        margin-bottom: 2rem;
      }
      .login-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: var(--color-ledger-accent);
        color: var(--color-ledger-ink-inv);
        margin-bottom: 0.75rem;
      }
      .login-title {
        font-family: var(--font-serif);
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-ledger-ink);
        letter-spacing: -0.03em;
        line-height: 1;
        margin-bottom: 0.25rem;
      }
      .login-subtitle {
        font-size: 13px;
        color: var(--color-ledger-ink-lt);
      }
      .login-card {
        width: 100%;
        max-width: 360px;
      }
      .login-form {
        display: flex;
        flex-direction: column;
      }
      .login-error {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 0.875rem;
        border-radius: var(--radius-ledger-md);
        background: var(--color-ledger-negative-bg);
        border: 1px solid var(--color-ledger-negative-bd);
        color: var(--color-ledger-negative);
        font-size: 13px;
        margin-bottom: 0.5rem;
      }
      .login-submit {
        width: 100%;
        padding: 0.625rem 1rem;
        margin-top: 0.25rem;
      }
      .loader {
        width: 14px;
        height: 14px;
        border: 2px solid rgba(245, 240, 232, 0.4);
        border-top-color: var(--color-ledger-ink-inv);
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        display: inline-block;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  // Model signal — fonte de verdade do formulário
  private readonly model = signal({ username: '', password: '' });

  // Field tree com validações
  readonly loginForm = form(this.model, (f: { username: any; password: any; }) => {
    required(f.username, { message: 'Usuário obrigatório' });
    required(f.password, { message: 'Senha obrigatória' });
  });

  // Validade geral do form
  readonly formValid = computed(
    () => this.loginForm.username().valid() && this.loginForm.password().valid(),
  );

  onSubmit(): void {
    if (!this.formValid() || this.loading()) return;

    this.loading.set(true);
    this.errorMessage.set('');

    const { username, password } = this.model();

    this.auth.login(username, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.errorMessage.set('Usuário ou senha inválidos.');
        this.loading.set(false);
      },
    });
  }
}
