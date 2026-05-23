'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Category = { id: string; name: string; color: string };
type Expense = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category_id: string | null;
  expense_date: string;
  notes: string | null;
  s3_receipt_key: string | null;
};

const CURRENCIES = ['MYR', 'USD', 'EUR', 'GBP', 'SGD'];

const emptyForm = {
  title: '',
  amount: '',
  currency: 'MYR',
  category_id: '',
  expense_date: new Date().toISOString().split('T')[0],
  notes: '',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Expense | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Receipt upload
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  // Filter
  const [filterCategory, setFilterCategory] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [exp, cats] = await Promise.all([
        apiFetch<Expense[]>('/api/expenses'),
        apiFetch<Category[]>('/api/categories'),
      ]);
      setExpenses(exp);
      setCategories(cats);
    } catch {
      setError('Failed to load expenses.');
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setForm(emptyForm);
    setFormError('');
    setEditTarget(null);
    setModal('add');
  }

  function openEdit(e: Expense) {
    setForm({
      title: e.title,
      amount: String(e.amount),
      currency: e.currency,
      category_id: e.category_id ? String(e.category_id) : '',
      expense_date: e.expense_date.split('T')[0],
      notes: e.notes ?? '',
    });
    setFormError('');
    setEditTarget(e);
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditTarget(null);
    setFormError('');
  }

  async function handleSave() {
    if (!form.title || !form.amount || !form.expense_date) {
      setFormError('Title, amount and date are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const body = {
        title: form.title,
        amount: parseFloat(form.amount),
        currency: form.currency,
        category_id: form.category_id || null,
        expense_date: form.expense_date,
        notes: form.notes || null,
      };
      if (modal === 'add') {
        await apiFetch('/api/expenses', { method: 'POST', body: JSON.stringify(body) });
      } else if (editTarget) {
        await apiFetch(`/api/expenses/${editTarget.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      }
      await load();
      closeModal();
    } catch {
      setFormError('Failed to save expense.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this expense?')) return;
    try {
      await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert('Failed to delete.');
    }
  }

  async function handleReceiptUpload(expense: Expense, file: File) {
    setUploadingId(expense.id);
    try {
      const { uploadUrl, key } = await apiFetch<{ uploadUrl: string; key: string }>(
        `/api/expenses/${expense.id}/receipt-upload-url`,
        {
          method: 'POST',
          body: JSON.stringify({ contentType: file.type }),
        }
      );
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
      await apiFetch(`/api/expenses/${expense.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ s3_receipt_key: key }),
      });
      await load();
    } catch {
      alert('Receipt upload failed. S3 must be configured for uploads.');
    } finally {
      setUploadingId(null);
    }
  }

  const catMap: Record<string, Category> = {};
  for (const c of categories) catMap[c.id] = c;

  const filtered = expenses
    .filter((e) => (filterCategory ? e.category_id === filterCategory : true))
    .filter((e) => (filterMonth ? e.expense_date?.startsWith(filterMonth) : true))
    .sort((a, b) => new Date(b.expense_date).getTime() - new Date(a.expense_date).getTime());

  const fmt = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-MY', { style: 'currency', currency }).format(amount);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[#1A1A1A] text-2xl font-semibold tracking-tight">Expenses</h1>
            <p className="text-[#888] text-sm mt-1">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openAdd}
            className="bg-[#1A1A1A] text-white text-sm px-4 py-2 rounded-md hover:bg-[#333] transition-colors"
          >
            + Add expense
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-[#D5D4D0] bg-white rounded-md px-3 py-2 text-sm text-[#555] focus:outline-none focus:border-[#1A1A1A]"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="border border-[#D5D4D0] bg-white rounded-md px-3 py-2 text-sm text-[#555] focus:outline-none focus:border-[#1A1A1A]"
          />
          {(filterCategory || filterMonth) && (
            <button
              onClick={() => { setFilterCategory(''); setFilterMonth(''); }}
              className="text-xs text-[#AAA] hover:text-[#555] transition-colors px-2"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-md px-4 py-3 mb-6">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <p className="text-sm text-[#AAA] py-10 text-center">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#E5E4E0] rounded-lg px-6 py-16 text-center">
            <p className="text-sm text-[#AAA] mb-2">No expenses found.</p>
            <button onClick={openAdd} className="text-xs text-[#555] underline">Add your first expense</button>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E4E0] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E4E0]">
                  {['Date', 'Title', 'Category', 'Amount', 'Receipt', ''].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-medium text-[#AAA] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr
                    key={e.id}
                    className={`${i !== filtered.length - 1 ? 'border-b border-[#F0EFEB]' : ''} hover:bg-[#FAFAF9] transition-colors`}
                  >
                    <td className="px-5 py-3.5 text-[#888] whitespace-nowrap">
                      {new Date(e.expense_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-[#1A1A1A] font-medium">{e.title}</p>
                      {e.notes && <p className="text-xs text-[#AAA] mt-0.5 truncate max-w-[180px]">{e.notes}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      {e.category_id && catMap[e.category_id] ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#555]">
                          <span
                            className="w-2 h-2 rounded-full inline-block flex-shrink-0"
                            style={{ backgroundColor: catMap[e.category_id].color }}
                          />
                          {catMap[e.category_id].name}
                        </span>
                      ) : (
                        <span className="text-xs text-[#CCC]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#1A1A1A] whitespace-nowrap">
                      {fmt(e.amount, e.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      {e.s3_receipt_key ? (
                        <span className="text-xs text-emerald-600 font-medium">✓ Attached</span>
                      ) : (
                        <label className="cursor-pointer text-xs text-[#AAA] hover:text-[#555] transition-colors">
                          {uploadingId === e.id ? 'Uploading…' : 'Upload'}
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(ev) => {
                              if (ev.target.files?.[0]) handleReceiptUpload(e, ev.target.files[0]);
                            }}
                          />
                        </label>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => openEdit(e)}
                          className="text-xs text-[#888] hover:text-[#1A1A1A] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="text-xs text-[#CCC] hover:text-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg border border-[#E5E4E0] w-full max-w-md shadow-sm">

            <div className="px-6 py-4 border-b border-[#E5E4E0] flex items-center justify-between">
              <h2 className="text-sm font-medium text-[#1A1A1A]">
                {modal === 'add' ? 'Add expense' : 'Edit expense'}
              </h2>
              <button onClick={closeModal} className="text-[#AAA] hover:text-[#1A1A1A] text-lg leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-4">

              <div>
                <label className="block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-widest">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Lunch at Mamak"
                  className="w-full border border-[#D5D4D0] bg-white rounded-md px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#C0BFB9] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-widest">Amount</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-[#D5D4D0] bg-white rounded-md px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#C0BFB9] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-widest">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full border border-[#D5D4D0] bg-white rounded-md px-3.5 py-2.5 text-sm text-[#555] focus:outline-none focus:border-[#1A1A1A]"
                  >
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-widest">Category</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full border border-[#D5D4D0] bg-white rounded-md px-3.5 py-2.5 text-sm text-[#555] focus:outline-none focus:border-[#1A1A1A]"
                  >
                    <option value="">None</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-widest">Date</label>
                  <input
                    type="date"
                    value={form.expense_date}
                    onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
                    className="w-full border border-[#D5D4D0] bg-white rounded-md px-3.5 py-2.5 text-sm text-[#555] focus:outline-none focus:border-[#1A1A1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-widest">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional notes…"
                  rows={2}
                  className="w-full border border-[#D5D4D0] bg-white rounded-md px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#C0BFB9] focus:outline-none focus:border-[#1A1A1A] transition-colors resize-none"
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
                {saving ? 'Saving…' : modal === 'add' ? 'Add expense' : 'Save changes'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}