'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Category = { id: string; name: string; color: string };
type BudgetRow = {
  id: string;
  category_id: string;
  month: number;
  year: number;
  allocated_amount: number;
  categoryName: string;
  categoryColor: string;
  spent: number;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function BudgetsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<BudgetRow | null>(null);
  const [form, setForm] = useState({ category_id: '', allocated_amount: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => { load(); }, [month, year]);

  async function load() {
    setLoading(true);
    try {
      const [budgetData, catData] = await Promise.all([
        apiFetch(`/api/budgets?month=${month}&year=${year}`),
        apiFetch<Category[]>('/api/categories'),
      ]);

      const rows: BudgetRow[] = (budgetData as Array<{
        id: string;
        category_id: string;
        month: number;
        year: number;
        allocated_amount: string | number;
        category_name?: string;
        category_color?: string;
        spent?: string | number;
      }>).map((b) => ({
        id: b.id,
        category_id: b.category_id,
        month: b.month,
        year: b.year,
        allocated_amount: Number(b.allocated_amount),
        categoryName: b.category_name ?? 'Unknown',
        categoryColor: b.category_color ?? '#888',
        spent: Number(b.spent ?? 0),
      }));

      setBudgets(rows);
      setCategories(catData);
    } catch {
      setError('Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm({ category_id: '', allocated_amount: '' });
    setFormError('');
    setEditTarget(null);
    setModal('add');
  }

  function openEdit(b: BudgetRow) {
    setForm({ category_id: String(b.category_id), allocated_amount: String(b.allocated_amount) });
    setFormError('');
    setEditTarget(b);
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditTarget(null);
    setFormError('');
  }

  async function handleSave() {
    if (!form.category_id || !form.allocated_amount) {
      setFormError('Category and amount are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const body = {
        category_id: form.category_id,
        month,
        year,
        allocated_amount: parseFloat(form.allocated_amount),
      };
      await apiFetch('/api/budgets', { method: 'PUT', body: JSON.stringify(body) });
      await load();
      closeModal();
    } catch {
      setFormError('Failed to save budget. This category may already have a budget for this month.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this budget?')) return;
    try {
      await apiFetch(`/api/budgets/${id}`, { method: 'DELETE' });
      setBudgets((prev) => prev.filter((b) => b.id !== id));
    } catch {
      alert('Failed to delete budget.');
    }
  }

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' }).format(n);

  const totalAllocated = budgets.reduce((s, b) => s + b.allocated_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct = totalAllocated > 0 ? Math.min((totalSpent / totalAllocated) * 100, 100) : 0;

  // Categories that don't have a budget this month yet
  const usedCategoryIds = new Set(budgets.map((b) => b.category_id));
  const availableCategories = categories.filter((c) => !usedCategoryIds.has(c.id));

  const years = [year - 1, year, year + 1];

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-[#1A1A1A] text-2xl font-semibold tracking-tight">Budgets</h1>
            <p className="text-[#888] text-sm mt-1">Set monthly spending limits per category.</p>
          </div>
          <button
            onClick={openAdd}
            disabled={availableCategories.length === 0}
            className="bg-[#1A1A1A] text-white text-sm px-4 py-2 rounded-md hover:bg-[#333] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add budget
          </button>
        </div>

        {/* Month / Year selector */}
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <div className="flex items-center border border-[#E5E4E0] bg-white rounded-md overflow-hidden">
            {MONTHS.map((m, i) => (
              <button
                key={m}
                onClick={() => setMonth(i + 1)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  month === i + 1
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#888] hover:text-[#1A1A1A]'
                }`}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
          <div className="flex items-center border border-[#E5E4E0] bg-white rounded-md overflow-hidden">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={`px-3 py-1.5 text-xs transition-colors ${
                  year === y
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#888] hover:text-[#1A1A1A]'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-md px-4 py-3 mb-6">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Overall summary */}
        {budgets.length > 0 && (
          <div className="bg-white border border-[#E5E4E0] rounded-lg px-6 py-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-[#1A1A1A]">
                {MONTHS[month - 1]} {year} — overall
              </span>
              <span className={`text-sm font-medium ${totalSpent > totalAllocated ? 'text-red-500' : 'text-[#1A1A1A]'}`}>
                {fmt(totalSpent)} <span className="text-[#AAA] font-normal">/ {fmt(totalAllocated)}</span>
              </span>
            </div>
            <div className="h-1.5 bg-[#F0EFEB] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${overallPct}%`,
                  backgroundColor: totalSpent > totalAllocated ? '#ef4444' : '#1A1A1A',
                }}
              />
            </div>
            <p className="text-xs text-[#AAA] mt-2">
              {overallPct.toFixed(1)}% of total budget used
            </p>
          </div>
        )}

        {/* Budget rows */}
        {loading ? (
          <p className="text-sm text-[#AAA] py-10 text-center">Loading…</p>
        ) : budgets.length === 0 ? (
          <div className="bg-white border border-[#E5E4E0] rounded-lg px-6 py-16 text-center">
            <p className="text-sm text-[#AAA] mb-2">No budgets for {MONTHS[month - 1]} {year}.</p>
            {availableCategories.length > 0 && (
              <button onClick={openAdd} className="text-xs text-[#555] underline">
                Set a budget
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map((b) => {
              const pct = b.allocated_amount > 0
                ? Math.min((b.spent / b.allocated_amount) * 100, 100)
                : 0;
              const over = b.spent > b.allocated_amount;
              const remaining = b.allocated_amount - b.spent;

              return (
                <div key={b.id} className="bg-white border border-[#E5E4E0] rounded-lg px-6 py-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: b.categoryColor }}
                      />
                      <span className="text-sm font-medium text-[#1A1A1A]">{b.categoryName}</span>
                      {over && (
                        <span className="text-xs bg-red-50 text-red-500 border border-red-100 px-2 py-0.5 rounded-full">
                          Over budget
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium ${over ? 'text-red-500' : 'text-[#1A1A1A]'}`}>
                        {fmt(b.spent)}{' '}
                        <span className="text-[#AAA] font-normal text-xs">/ {fmt(b.allocated_amount)}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(b)}
                          className="text-xs text-[#888] hover:text-[#1A1A1A] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(b.id)}
                          className="text-xs text-[#CCC] hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="h-1 bg-[#F0EFEB] rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: over ? '#ef4444' : b.categoryColor,
                      }}
                    />
                  </div>

                  <p className="text-xs text-[#AAA]">
                    {over
                      ? `${fmt(Math.abs(remaining))} over budget`
                      : `${fmt(remaining)} remaining · ${pct.toFixed(1)}% used`}
                  </p>
                </div>
              );
            })}
          </div>
        )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg border border-[#E5E4E0] w-full max-w-sm">

            <div className="px-6 py-4 border-b border-[#E5E4E0] flex items-center justify-between">
              <h2 className="text-sm font-medium text-[#1A1A1A]">
                {modal === 'add' ? 'Add budget' : 'Edit budget'}
              </h2>
              <button onClick={closeModal} className="text-[#AAA] hover:text-[#1A1A1A] text-lg leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">

              <div className="bg-[#FAFAF9] rounded-md px-4 py-2.5">
                <p className="text-xs text-[#888]">
                  Setting budget for{' '}
                  <span className="font-medium text-[#1A1A1A]">{MONTHS[month - 1]} {year}</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-widest">
                  Category
                </label>
                <select
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  disabled={modal === 'edit'}
                  className="w-full border border-[#D5D4D0] bg-white rounded-md px-3.5 py-2.5 text-sm text-[#555] focus:outline-none focus:border-[#1A1A1A] disabled:opacity-50"
                >
                  <option value="">Select a category</option>
                  {(modal === 'edit' ? categories : availableCategories).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-widest">
                  Monthly limit (MYR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.allocated_amount}
                  onChange={(e) => setForm({ ...form, allocated_amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full border border-[#D5D4D0] bg-white rounded-md px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#C0BFB9] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-100 rounded-md px-3.5 py-2.5">
                  <p className="text-xs text-red-600">{formError}</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#E5E4E0] flex items-center justify-end gap-3">
              <button
                onClick={closeModal}
                className="text-sm text-[#888] hover:text-[#1A1A1A] transition-colors px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#1A1A1A] text-white text-sm px-5 py-2 rounded-md hover:bg-[#333] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving…' : modal === 'add' ? 'Add budget' : 'Save changes'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}