'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

type Category = { id: string; name: string; color: string };

const PRESET_COLORS = [
  '#1A1A1A', '#555555', '#888888',
  '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#14b8a6', '#3b82f6',
  '#8b5cf6', '#ec4899', '#6366f1',
];

const emptyForm = { name: '', color: '#3b82f6' };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<Category[]>('/api/categories');
      setCategories(data);
    } catch {
      setError('Failed to load categories.');
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

  function openEdit(c: Category) {
    setForm({ name: c.name, color: c.color });
    setFormError('');
    setEditTarget(c);
    setModal('edit');
  }

  function closeModal() {
    setModal(null);
    setEditTarget(null);
    setFormError('');
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFormError('Category name is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'add') {
        await apiFetch('/api/categories', {
          method: 'POST',
          body: JSON.stringify({ name: form.name.trim(), color: form.color }),
        });
      } else if (editTarget) {
        await apiFetch(`/api/categories/${editTarget.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: form.name.trim(), color: form.color }),
        });
      }
      await load();
      closeModal();
    } catch {
      setFormError('Failed to save category.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this category? Expenses in this category will become uncategorised.')) return;
    try {
      await apiFetch(`/api/categories/${id}`, { method: 'DELETE' });
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Failed to delete category.');
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[#1A1A1A] text-2xl font-semibold tracking-tight">Categories</h1>
            <p className="text-[#888] text-sm mt-1">Organise your expenses into groups.</p>
          </div>
          <button
            onClick={openAdd}
            className="bg-[#1A1A1A] text-white text-sm px-4 py-2 rounded-md hover:bg-[#333] transition-colors"
          >
            + Add category
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-md px-4 py-3 mb-6">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <p className="text-sm text-[#AAA] py-10 text-center">Loading…</p>
        ) : categories.length === 0 ? (
          <div className="bg-white border border-[#E5E4E0] rounded-lg px-6 py-16 text-center">
            <p className="text-sm text-[#AAA] mb-2">No categories yet.</p>
            <button onClick={openAdd} className="text-xs text-[#555] underline">
              Create your first category
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="bg-white border border-[#E5E4E0] rounded-lg px-5 py-4 flex items-center justify-between hover:border-[#C0BFB9] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-md flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-sm font-medium text-[#1A1A1A]">{c.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => openEdit(c)}
                    className="text-xs text-[#888] hover:text-[#1A1A1A] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-xs text-[#CCC] hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg border border-[#E5E4E0] w-full max-w-sm">

            <div className="px-6 py-4 border-b border-[#E5E4E0] flex items-center justify-between">
              <h2 className="text-sm font-medium text-[#1A1A1A]">
                {modal === 'add' ? 'Add category' : 'Edit category'}
              </h2>
              <button onClick={closeModal} className="text-[#AAA] hover:text-[#1A1A1A] text-lg leading-none">×</button>
            </div>

            <div className="px-6 py-5 space-y-5">

              <div>
                <label className="block text-xs font-medium text-[#555] mb-1.5 uppercase tracking-widest">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Food & Drinks"
                  className="w-full border border-[#D5D4D0] bg-white rounded-md px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#C0BFB9] focus:outline-none focus:border-[#1A1A1A] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#555] mb-3 uppercase tracking-widest">
                  Color
                </label>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className="w-8 h-8 rounded-md transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        outline: form.color === color ? '2px solid #1A1A1A' : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-xs text-[#AAA]">Or pick a custom color</span>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-[#FAFAF9] rounded-md px-4 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-md" style={{ backgroundColor: form.color }} />
                <span className="text-sm text-[#555]">{form.name || 'Category preview'}</span>
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
                {saving ? 'Saving…' : modal === 'add' ? 'Add category' : 'Save changes'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}