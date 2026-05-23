'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, type User } from '@/lib/api';
import { isDevAuthMode, signOut } from '@/lib/auth';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    authApi
      .me()
      .then((data) => {
        setUser(data);
        setFullName(data.full_name);
        setEmail(data.email);
      })
      .catch(() => setError('Could not load your profile. Try signing in again.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await authApi.updateMe({
        full_name: fullName.trim(),
        email: email.trim(),
      });
      setUser(updated);
      setSuccess('Profile updated.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  function handleSignOut() {
    signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <p className="text-sm text-[#AAA]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#1A1A1A]">Account</h1>
        <p className="mt-1 text-sm text-[#888]">View and update your profile.</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-100 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3">
          <p className="text-xs text-emerald-700">{success}</p>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-lg border border-[#E5E4E0] bg-white p-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-[#555]">
              Full name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-[#D5D4D0] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-[#555]">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-[#D5D4D0] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
            />
          </div>

          {user && (
            <div className="border-t border-[#F0EFEB] pt-4">
              <p className="text-xs text-[#AAA]">
                Role: <span className="text-[#555] capitalize">{user.role}</span>
              </p>
              <p className="mt-1 text-xs text-[#AAA]">
                Member since{' '}
                <span className="text-[#555]">
                  {new Date(user.created_at).toLocaleDateString('en-MY', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </p>
            </div>
          )}

          {isDevAuthMode() && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
              Dev mode — profile is stored in the local database only.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-md bg-[#1A1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#333] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <div className="mt-10 border-t border-[#E5E4E0] pt-8">
        <h2 className="mb-1 text-sm font-medium text-[#1A1A1A]">Sign out</h2>
        <p className="mb-4 text-xs text-[#888]">End your session on this device.</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-md border border-[#E5E4E0] bg-white py-2.5 text-sm text-[#555] transition-colors hover:border-[#999] hover:text-[#1A1A1A]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
