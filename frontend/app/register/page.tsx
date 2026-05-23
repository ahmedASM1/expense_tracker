'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthPageShell from '@/components/AuthPageShell';
import { confirmSignUp, isDevAuthMode, signIn, signUp } from '@/lib/auth';

type Step = 'register' | 'confirm';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isDevAuthMode()) {
        await signUp(email, password, fullName);
        await signIn(email, password);
        router.push('/dashboard');
        return;
      }
      await signUp(email, password, fullName);
      setStep('confirm');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignUp(email, code);
      router.push('/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Confirmation failed.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell footerLink={{ text: 'Have an account?', label: 'Sign in', href: '/login' }}>
      {!isDevAuthMode() && (
        <div className="mb-8 flex items-center gap-2">
          <div
            className={`h-1 flex-1 rounded-full ${step === 'register' ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]'}`}
          />
          <div
            className={`h-1 flex-1 rounded-full ${step === 'confirm' ? 'bg-[#1A1A1A]' : 'bg-[#E5E4E0]'}`}
          />
        </div>
      )}

      {step === 'register' ? (
        <>
          <div className="mb-8">
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#1A1A1A]">
              Create account
            </h1>
            <p className="text-sm text-[#888]">
              {isDevAuthMode()
                ? 'No AWS setup needed — you’ll go straight to the dashboard.'
                : 'Fill in your details to get started.'}
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-[#555]">
                Full name
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Smith"
                className="w-full rounded-md border border-[#D5D4D0] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#C0BFB9] focus:border-[#1A1A1A] focus:outline-none"
              />
            </div>

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
                className="w-full rounded-md border border-[#D5D4D0] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#C0BFB9] focus:border-[#1A1A1A] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-[#555]">
                Password
              </label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-md border border-[#D5D4D0] bg-white px-3.5 py-2.5 text-sm text-[#1A1A1A] placeholder-[#C0BFB9] focus:border-[#1A1A1A] focus:outline-none"
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
              className="mt-2 w-full rounded-md bg-[#1A1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#333] disabled:opacity-50"
            >
              {loading ? 'Creating account…' : isDevAuthMode() ? 'Continue to dashboard' : 'Continue'}
            </button>
          </form>
        </>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-[#1A1A1A]">
              Confirm your email
            </h1>
            <p className="text-sm text-[#888]">
              We sent a 6-digit code to <span className="font-medium text-[#555]">{email}</span>
            </p>
          </div>

          <form onSubmit={handleConfirm} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-widest text-[#555]">
                Confirmation code
              </label>
              <input
                type="text"
                required
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full rounded-md border border-[#D5D4D0] bg-white px-3.5 py-2.5 text-center text-sm font-medium tracking-widest text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
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
              className="mt-2 w-full rounded-md bg-[#1A1A1A] py-2.5 text-sm font-medium text-white hover:bg-[#333] disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Confirm & sign in'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('register');
                setError('');
              }}
              className="w-full py-1 text-sm text-[#888] hover:text-[#1A1A1A]"
            >
              ← Back
            </button>
          </form>
        </>
      )}

      <p className="mt-8 text-center text-xs text-[#AAA]">
        {isDevAuthMode() ? 'Local dev auth' : 'Auth powered by AWS Cognito'}
      </p>
    </AuthPageShell>
  );
}
