import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.loginComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.dashboardComponent),
    // canActivate: [authGuard] — adicionado na TASK-03
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./features/transactions/transactions.component').then((m) => m.transactionsComponent),
    // canActivate: [authGuard]
  },
  {
    path: 'recurring',
    loadComponent: () =>
      import('./features/recurring/recurring.component').then((m) => m.recurringComponent),
    // canActivate: [authGuard]
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./features/categories/categories.component').then((m) => m.categoriesComponent),
    // canActivate: [authGuard]
  },
  {
    path: 'persons',
    loadComponent: () =>
      import('./features/persons/persons.component').then((m) => m.personsComponent),
    // canActivate: [authGuard]
  },
  {
    path: 'split',
    loadComponent: () => import('./features/split/split.component').then((m) => m.splitComponent),
    // canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: '/dashboard',
  },
];
