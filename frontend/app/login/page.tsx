'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageShell from '@/components/AuthPageShell';
import { isDevAuthMode, signIn } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign in failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell footerLink={{ text: 'No account?', label: 'Register', href: '/register' }}>
      <div className="mb-8">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#1A1A1A]">Sign in</h1>
        <p className="text-sm text-[#888]">
          {isDevAuthMode()
            ? 'Use any email and password to explore the app locally.'
            : 'Enter your credentials to continue.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-[#555]">
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-md border border-[#D5D4D0] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#C0BFB9] transition-colors focus:border-[#1A1A1A] focus:outline-none"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-xs font-medium uppercase tracking-widest text-[#555]">
              Password
            </label>
            {!isDevAuthMode() && (
              <span className="text-xs text-[#AAA]">Forgot password? (coming soon)</span>
            )}
          </div>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-md border border-[#D5D4D0] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#C0BFB9] transition-colors focus:border-[#1A1A1A] focus:outline-none"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-100 bg-red-50 px-3.5 py-2.5">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-[#1A1A1A] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-[#AAA]">
        {isDevAuthMode() ? 'Local dev auth' : 'Auth powered by AWS Cognito'}
      </p>
    </AuthPageShell>
  );
}
