export * from './enums';

export interface Category {
  id: string;
  name: string;
  type: 'RECEITA' | 'DESPESA';
  predefined: boolean;
}

export interface Person {
  id: string;
  name: string;
}

export interface Transaction {
  id: string;
  description: string;
  category: Category;
  type: 'RECEITA' | 'DESPESA';
  referenceMonth: number;
  referenceYear: number;
  amountExpected: number;
  amountPaid: number | null;
  status: 'PENDENTE' | 'PAGO';
  recurringId: string | null;
  isOverride: boolean;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  category: Category;
  type: 'RECEITA' | 'DESPESA';
  defaultAmount: number;
  active: boolean;
}

export interface SplitRuleItem {
  person: Person;
  percentage: number;
}

export interface SplitRule {
  year: number;
  month: number;
  items: SplitRuleItem[];
}

export interface DashboardSummary {
  totalIncomeExpected: number;
  totalIncomePaid: number;
  totalExpenseExpected: number;
  totalExpensePaid: number;
  balanceExpected: number;
  balancePaid: number;
}

export interface CategoryTotal {
  category: Category;
  totalExpected: number;
  totalPaid: number;
}

export interface MonthEvolution {
  month: number;
  totalIncomeExpected: number;
  totalIncomePaid: number;
  totalExpenseExpected: number;
  totalExpensePaid: number;
}

export interface SplitResultItem {
  person: Person;
  percentage: number;
  amount: number;
}

export interface SplitResult {
  totalExpenseExpected: number;
  items: SplitResultItem[];
}
