const BASE = typeof window === 'undefined'
  ? (process.env.BACKEND_URL ?? 'http://localhost:4000')
  : '';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new ApiError(res.status, text);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/** Fetch helper used by dashboard pages. Accepts paths with or without `/api` prefix. */
export async function apiFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const normalized = path.startsWith('/api') ? path.slice(4) : path;
  return request<T>(normalized, init);
}

// ── Auth ────────────────────────────────────────────────────
export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export const authApi = {
  register: (body: { cognitoSub: string; fullName: string; email: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  me: () => request<User>('/auth/me'),

  updateMe: (body: { full_name?: string; email?: string }) =>
    request<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
};

// ── Expenses ────────────────────────────────────────────────
export const expensesApi = {
  list: (params?: { category_id?: string; start_date?: string; end_date?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v))
    ).toString();
    return request<Expense[]>(`/expenses${qs ? `?${qs}` : ''}`);
  },

  get: (id: string) => request<Expense>(`/expenses/${id}`),

  create: (body: {
    title: string;
    amount: number;
    currency?: string;
    category_id?: string | null;
    expense_date?: string;
    notes?: string;
  }) => request<Expense>('/expenses', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: string, body: Partial<Expense>) =>
    request<Expense>(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: (id: string) => request<void>(`/expenses/${id}`, { method: 'DELETE' }),

  getReceiptUploadUrl: (id: string, contentType = 'image/jpeg') =>
    request<{ uploadUrl: string; key: string }>(`/expenses/${id}/receipt-upload-url`, {
      method: 'POST',
      body: JSON.stringify({ contentType }),
    }),
};

// ── Categories ──────────────────────────────────────────────
export const categoriesApi = {
  list: () => request<Category[]>('/categories'),

  create: (body: { name: string; color?: string }) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(body) }),

  update: (id: string, body: { name?: string; color?: string }) =>
    request<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: (id: string) => request<void>(`/categories/${id}`, { method: 'DELETE' }),
};

// ── Budgets ─────────────────────────────────────────────────
export const budgetsApi = {
  list: (params?: { month?: number; year?: number }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).map(([k, v]) => [k, String(v)]).filter(([, v]) => v)
      )
    ).toString();
    return request<Budget[]>(`/budgets${qs ? `?${qs}` : ''}`);
  },

  upsert: (body: {
    category_id: string;
    month: number;
    year: number;
    allocated_amount: number;
  }) => request<Budget>('/budgets', { method: 'PUT', body: JSON.stringify(body) }),

  delete: (id: string) => request<void>(`/budgets/${id}`, { method: 'DELETE' }),
};

// ── Types ───────────────────────────────────────────────────
export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category_id: string | null;
  category_name?: string;
  category_color?: string;
  expense_date: string;
  s3_receipt_key: string | null;
  notes: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Budget {
  id: string;
  category_id: string;
  category_name: string;
  category_color: string;
  month: number;
  year: number;
  allocated_amount: number;
  spent: number;
  created_at: string;
}
