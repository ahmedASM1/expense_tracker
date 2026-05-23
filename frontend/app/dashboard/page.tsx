'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  budgetsApi,
  categoriesApi,
  expensesApi,
  type Budget,
  type Category,
  type Expense,
} from '@/lib/api';

type Summary = {
  totalThisMonth: number;
  totalLastMonth: number;
  budgetUsed: number;
  budgetTotal: number;
  topCategory: string;
  recentExpenses: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    category: string;
    expense_date: string;
  }[];
  budgets: {
    category: string;
    allocated: number;
    spent: number;
    color: string;
  }[];
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const [expenses, budgets, categories] = await Promise.all([
          expensesApi.list(),
          budgetsApi.list({ month, year }),
          categoriesApi.list(),
        ]);

        const catMap: Record<string, { name: string; color: string }> = {};
        for (const c of categories as Category[]) {
          catMap[c.id] = { name: c.name, color: c.color };
        }

        const thisMonthStr = `${year}-${String(month).padStart(2, '0')}`;
        const lastMonthDate = new Date(year, month - 2, 1);
        const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

        const totalThisMonth = (expenses as Expense[])
          .filter((e) => e.expense_date?.startsWith(thisMonthStr))
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const totalLastMonth = (expenses as Expense[])
          .filter((e) => e.expense_date?.startsWith(lastMonthStr))
          .reduce((sum, e) => sum + Number(e.amount), 0);

        const budgetTotal = (budgets as Budget[]).reduce(
          (s, b) => s + Number(b.allocated_amount),
          0
        );

        const budgetUsed = (budgets as Budget[]).reduce((s, b) => {
          const spent = (expenses as Expense[])
            .filter(
              (e) =>
                e.category_id === b.category_id && e.expense_date?.startsWith(thisMonthStr)
            )
            .reduce((ss, e) => ss + Number(e.amount), 0);
          return s + spent;
        }, 0);

        const catTotals: Record<string, number> = {};
        for (const e of (expenses as Expense[]).filter((ex) =>
          ex.expense_date?.startsWith(thisMonthStr)
        )) {
          const name = catMap[e.category_id]?.name ?? 'Uncategorised';
          catTotals[name] = (catTotals[name] ?? 0) + Number(e.amount);
        }
        const topCategory =
          Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

        const recentExpenses = [...(expenses as Expense[])]
          .sort(
            (a, b) =>
              new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime()
          )
          .slice(0, 5)
          .map((e) => ({
            id: e.id,
            title: e.title,
            amount: Number(e.amount),
            currency: e.currency ?? 'MYR',
            category: catMap[e.category_id]?.name ?? 'Uncategorised',
            expense_date: e.expense_date,
          }));

        const budgetRows = (budgets as Budget[]).map((b) => {
          const spent = (expenses as Expense[])
            .filter(
              (e) =>
                e.category_id === b.category_id && e.expense_date?.startsWith(thisMonthStr)
            )
            .reduce((ss, e) => ss + Number(e.amount), 0);
          return {
            category: catMap[b.category_id]?.name ?? 'Unknown',
            allocated: Number(b.allocated_amount),
            spent,
            color: catMap[b.category_id]?.color ?? '#888',
          };
        });

        setSummary({
          totalThisMonth,
          totalLastMonth,
          budgetUsed,
          budgetTotal,
          topCategory,
          recentExpenses,
          budgets: budgetRows,
        });
      } catch {
        setError('Failed to load dashboard data. Sign in again if your session expired.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(n);

  const monthChange = summary
    ? summary.totalLastMonth === 0
      ? null
      : ((summary.totalThisMonth - summary.totalLastMonth) / summary.totalLastMonth) * 100
    : null;

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-sm text-[#AAA]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Overview</h1>
          <p className="mt-1 text-sm text-[#888]">
            {new Date().toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-100 bg-red-50 px-4 py-3">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Spent this month',
              value: fmt(summary?.totalThisMonth ?? 0),
              sub:
                monthChange !== null
                  ? `${monthChange >= 0 ? '+' : ''}${monthChange.toFixed(1)}% vs last month`
                  : 'No data last month',
            },
            {
              label: 'Budget used',
              value: fmt(summary?.budgetUsed ?? 0),
              sub: summary?.budgetTotal
                ? `of ${fmt(summary.budgetTotal)} allocated`
                : 'No budgets set',
            },
            {
              label: 'Top category',
              value: summary?.topCategory ?? '—',
              sub: 'This month',
            },
            {
              label: 'Last month',
              value: fmt(summary?.totalLastMonth ?? 0),
              sub: 'Total spending',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-[#E5E4E0] bg-white px-4 py-4"
            >
              <p className="mb-2 text-xs text-[#AAA]">{card.label}</p>
              <p className="text-lg font-medium leading-tight text-[#1A1A1A]">{card.value}</p>
              <p className="mt-1 text-xs text-[#AAA]">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="overflow-hidden rounded-lg border border-[#E5E4E0] bg-white">
            <div className="flex items-center justify-between border-b border-[#E5E4E0] px-5 py-4">
              <h2 className="text-sm font-medium text-[#1A1A1A]">Recent expenses</h2>
              <Link
                href="/dashboard/expenses"
                className="text-xs text-[#AAA] hover:text-[#1A1A1A]"
              >
                View all →
              </Link>
            </div>
            {!summary?.recentExpenses.length ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-[#AAA]">No expenses yet.</p>
                <Link
                  href="/dashboard/expenses"
                  className="mt-2 inline-block text-xs text-[#555] underline"
                >
                  Add your first expense
                </Link>
              </div>
            ) : (
              <ul>
                {summary.recentExpenses.map((e, i) => (
                  <li
                    key={e.id}
                    className={`flex items-center justify-between px-5 py-3.5 ${
                      i !== summary.recentExpenses.length - 1
                        ? 'border-b border-[#F0EFEB]'
                        : ''
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{e.title}</p>
                      <p className="mt-0.5 text-xs text-[#AAA]">
                        {e.category} ·{' '}
                        {new Date(e.expense_date).toLocaleDateString('en-MY', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-[#1A1A1A]">
                      {new Intl.NumberFormat('en-MY', {
                        style: 'currency',
                        currency: e.currency,
                      }).format(e.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border border-[#E5E4E0] bg-white">
            <div className="flex items-center justify-between border-b border-[#E5E4E0] px-5 py-4">
              <h2 className="text-sm font-medium text-[#1A1A1A]">Budget status</h2>
              <Link
                href="/dashboard/budgets"
                className="text-xs text-[#AAA] hover:text-[#1A1A1A]"
              >
                Manage →
              </Link>
            </div>
            {!summary?.budgets.length ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-[#AAA]">No budgets set.</p>
                <Link
                  href="/dashboard/budgets"
                  className="mt-2 inline-block text-xs text-[#555] underline"
                >
                  Set a budget
                </Link>
              </div>
            ) : (
              <ul className="space-y-4 px-5 py-4">
                {summary.budgets.map((b) => {
                  const pct = Math.min((b.spent / b.allocated) * 100, 100);
                  const over = b.spent > b.allocated;
                  return (
                    <li key={b.category}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs font-medium text-[#1A1A1A]">{b.category}</span>
                        <span className={`text-xs ${over ? 'text-red-500' : 'text-[#AAA]'}`}>
                          {fmt(b.spent)} / {fmt(b.allocated)}
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-[#F0EFEB]">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: over ? '#ef4444' : '#1A1A1A',
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
    </div>
  );
}
