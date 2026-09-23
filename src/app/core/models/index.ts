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
  dueDate: string | null;
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
  dueDay: number | null;
}

export interface SplitRuleItem {
  person: Person;
  percentage: number;
}

export interface SplitRule {
  effectiveFrom: string;
  items: SplitRuleItem[];
}

export interface DashboardSummary {
  totalIncomeExpected: number;
  totalIncomePaid: number;
  totalExpenseExpected: number;
  totalExpensePaid: number;
  balanceExpected: number;
  balancePaid: number;
  totalIncomePending: number;
  totalExpensePending: number;
  totalOverdueAmount: number;
  totalOverdueCount: number;
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

export type AssetType = 'RENDA_FIXA' | 'ACAO' | 'FUNDO' | 'CRIPTO' | 'IMOVEL' | 'OUTRO';

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  currentValue: number;
  /** código da posição no extrato da B3; nulo em ativo cadastrado à mão */
  externalCode: string | null;
  person: Person | null;
}

export interface NetWorthSummary {
  totalValue: number;
}

export interface AssetImportError {
  sheet: string;
  row: number;
  message: string;
  isInformational: boolean;
}

/** Reconciliação de uma aba do extrato: o que foi lido do arquivo vs. o que virou ativo. */
export interface AssetImportSheetSummary {
  sheet: string;
  rows: number;
  totalRead: number;
  totalPersisted: number;
}

export interface AssetImportResult {
  created: Asset[];
  updated: Asset[];
  /** ativos de um import anterior que não estão no arquivo — o import nunca os apaga */
  missing: Asset[];
  errors: AssetImportError[];
  sheets: AssetImportSheetSummary[];
  totalRead: number;
  totalPersisted: number;
}
