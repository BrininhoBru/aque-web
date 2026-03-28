import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/transactions/transactions.component').then(
            (m) => m.TransactionsComponent,
          ),
      },
      {
        path: 'transactions/form',
        loadComponent: () =>
          import('./features/transactions/transaction-form/transaction-form.component').then(
            (m) => m.TransactionFormComponent,
          ),
      },
      {
        path: 'transactions/form/:id',
        loadComponent: () =>
          import('./features/transactions/transaction-form/transaction-form.component').then(
            (m) => m.TransactionFormComponent,
          ),
      },
      {
        path: 'recurring',
        loadComponent: () =>
          import('./features/recurring/recurring.component').then((m) => m.RecurringComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      {
        path: 'persons',
        loadComponent: () =>
          import('./features/persons/persons.component').then((m) => m.PersonsComponent),
      },
      {
        path: 'split',
        loadComponent: () =>
          import('./features/split/split.component').then((m) => m.SplitComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
