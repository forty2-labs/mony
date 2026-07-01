/**
 * Hand-maintained mirror of the Supabase schema (see supabase/migrations).
 *
 * In a fuller setup you'd generate this with `supabase gen types typescript`,
 * but keeping it explicit here avoids a build-time dependency on the Supabase
 * CLI and documents the contract the frontend relies on.
 */

export type UUID = string;
export type Timestamptz = string;

export type BillingCycle = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type LoanStatus = 'outstanding' | 'partially_repaid' | 'repaid' | 'written_off';
export type IncomeSource =
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'interest'
  | 'refund'
  | 'other';

export interface ProfileRow {
  id: UUID; // = auth.users.id
  display_name: string | null;
  base_currency: string;
  inactivity_timeout_minutes: number;
  created_at: Timestamptz;
  updated_at: Timestamptz;
}

export interface CategoryRow {
  id: UUID;
  user_id: UUID;
  name: string;
  kind: 'expense' | 'income';
  color: string | null;
  icon: string | null;
  is_archived: boolean;
  created_at: Timestamptz;
  updated_at: Timestamptz;
}

export interface ExpenseRow {
  id: UUID;
  user_id: UUID;
  category_id: UUID | null;
  amount_original: number;
  currency_original: string;
  exchange_rate: number; // original -> base, frozen at entry time
  amount_base: number;
  occurred_on: string; // date
  notes: string | null;
  created_at: Timestamptz;
  updated_at: Timestamptz;
  deleted_at: Timestamptz | null;
}

export interface IncomeRow {
  id: UUID;
  user_id: UUID;
  category_id: UUID | null;
  source: IncomeSource;
  amount_original: number;
  currency_original: string;
  exchange_rate: number;
  amount_base: number;
  occurred_on: string;
  notes: string | null;
  created_at: Timestamptz;
  updated_at: Timestamptz;
  deleted_at: Timestamptz | null;
}

export interface BudgetRow {
  id: UUID;
  user_id: UUID;
  category_id: UUID | null;
  period_month: string; // first day of month, date
  amount_base: number;
  created_at: Timestamptz;
  updated_at: Timestamptz;
}

export interface SavingsGoalRow {
  id: UUID;
  user_id: UUID;
  name: string;
  target_amount_base: number;
  current_amount_base: number;
  deadline: string | null;
  created_at: Timestamptz;
  updated_at: Timestamptz;
}

export interface LoanRow {
  id: UUID;
  user_id: UUID;
  person_name: string;
  amount_original: number;
  currency_original: string;
  exchange_rate: number;
  amount_base: number;
  amount_repaid_base: number;
  expected_return_date: string | null;
  status: LoanStatus;
  notes: string | null;
  created_at: Timestamptz;
  updated_at: Timestamptz;
}

export interface SubscriptionRow {
  id: UUID;
  user_id: UUID;
  name: string;
  cost_original: number;
  currency_original: string;
  exchange_rate: number;
  cost_base: number;
  billing_cycle: BillingCycle;
  next_payment_date: string | null;
  is_active: boolean;
  created_at: Timestamptz;
  updated_at: Timestamptz;
}

export interface ExchangeRateRow {
  id: UUID;
  user_id: UUID;
  base_currency: string;
  quote_currency: string;
  rate: number;
  as_of: string; // date
  created_at: Timestamptz;
}

export interface AuditLogRow {
  id: UUID;
  user_id: UUID;
  action: string;
  entity: string;
  entity_id: UUID | null;
  metadata: Record<string, unknown> | null;
  created_at: Timestamptz;
}

type WithDefaults<T, Optional extends keyof T> = Omit<T, Optional> &
  Partial<Pick<T, Optional>>;

/** Keys of T whose type permits null — these are optional on insert. */
type NullableKeys<T> = {
  [K in keyof T]-?: null extends T[K] ? K : never;
}[keyof T];

type ServerManaged = 'id' | 'user_id' | 'created_at' | 'updated_at';

/**
 * An insert payload: server-managed columns and any nullable column are
 * optional; everything else is required.
 */
type Insertable<Row, Defaulted extends keyof Row> = WithDefaults<
  Row,
  Defaulted | NullableKeys<Row>
>;

/**
 * `interface` types lack an implicit index signature, so they don't satisfy
 * postgrest-js's `Record<string, unknown>` constraint on `GenericTable`. Mapping
 * over the keys produces an equivalent anonymous object type that does.
 */
type Flatten<T> = { [K in keyof T]: T[K] };

/**
 * Shape a single table to satisfy postgrest-js's `GenericTable`, which requires
 * Row/Insert/Update *and* a `Relationships` tuple. We don't model relationships
 * here (joins are written explicitly), so it's always an empty tuple.
 */
type TableDef<Row, Insert, Update> = {
  Row: Flatten<Row>;
  Insert: Flatten<Insert>;
  Update: Flatten<Update>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<
        ProfileRow,
        Insertable<ProfileRow, 'created_at' | 'updated_at'>,
        Partial<ProfileRow>
      >;
      categories: TableDef<
        CategoryRow,
        Insertable<CategoryRow, ServerManaged | 'is_archived'>,
        Partial<CategoryRow>
      >;
      expenses: TableDef<
        ExpenseRow,
        Insertable<ExpenseRow, ServerManaged | 'deleted_at'>,
        Partial<ExpenseRow>
      >;
      income: TableDef<
        IncomeRow,
        Insertable<IncomeRow, ServerManaged | 'deleted_at'>,
        Partial<IncomeRow>
      >;
      budgets: TableDef<
        BudgetRow,
        Insertable<BudgetRow, ServerManaged>,
        Partial<BudgetRow>
      >;
      savings_goals: TableDef<
        SavingsGoalRow,
        Insertable<SavingsGoalRow, ServerManaged | 'current_amount_base'>,
        Partial<SavingsGoalRow>
      >;
      loans: TableDef<
        LoanRow,
        Insertable<LoanRow, ServerManaged | 'amount_repaid_base'>,
        Partial<LoanRow>
      >;
      subscriptions: TableDef<
        SubscriptionRow,
        Insertable<SubscriptionRow, ServerManaged | 'is_active'>,
        Partial<SubscriptionRow>
      >;
      exchange_rates: TableDef<
        ExchangeRateRow,
        Insertable<ExchangeRateRow, 'id' | 'user_id' | 'created_at'>,
        Partial<ExchangeRateRow>
      >;
      audit_logs: TableDef<
        AuditLogRow,
        Insertable<AuditLogRow, 'id' | 'user_id' | 'created_at'>,
        Partial<AuditLogRow>
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      billing_cycle: BillingCycle;
      loan_status: LoanStatus;
      income_source: IncomeSource;
      category_kind: 'expense' | 'income';
    };
    CompositeTypes: Record<string, never>;
  };
}
