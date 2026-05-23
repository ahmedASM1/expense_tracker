'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';

type BackendStatus = 'checking' | 'online' | 'offline';

export default function HomePage() {
  const [status, setStatus] = useState<BackendStatus>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') setStatus('online');
        else setStatus('offline');
      })
      .catch(() => setStatus('offline'));
  }, []);

  return (
    <main className="min-h-screen bg-[#FAFAF9] flex flex-col">
      <nav className="shrink-0 border-b border-[#E5E4E0] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <Logo href="/" />
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="whitespace-nowrap px-3 py-1.5 text-sm text-[#555] transition-colors hover:text-[#1A1A1A]"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="whitespace-nowrap rounded-md bg-[#1A1A1A] px-4 py-1.5 text-sm text-white transition-colors hover:bg-[#333]"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:py-24">
        <div className="mx-auto w-full max-w-2xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#E5E4E0] bg-white px-4 py-1.5 sm:mb-10">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                status === 'checking'
                  ? 'bg-amber-400'
                  : status === 'online'
                    ? 'bg-emerald-500'
                    : 'bg-red-400'
              }`}
            />
            <span className="text-xs font-medium tracking-wide text-[#777]">
              {status === 'checking'
                ? 'Checking backend…'
                : status === 'online'
                  ? 'Backend connected'
                  : 'Backend offline'}
            </span>
          </div>

          <h1
            className="mb-5 font-semibold leading-tight text-[#1A1A1A]"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)', letterSpacing: '-0.02em' }}
          >
            Track every expense.
            <br />
            <span className="text-[#888]">Stay in control.</span>
          </h1>

          <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-[#666]">
            A clean, no-nonsense expense manager. Organise spending by category,
            set monthly budgets, and attach receipts — all in one place.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/register"
              className="rounded-md bg-[#1A1A1A] px-6 py-2.5 text-sm text-white transition-colors hover:bg-[#333]"
            >
              Create account
            </Link>
            <Link
              href="/login"
              className="rounded-md border border-[#D5D4D0] bg-white px-6 py-2.5 text-sm text-[#555] transition-colors hover:border-[#999]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="shrink-0 border-t border-[#E5E4E0] bg-white px-6 py-10 sm:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-10">
          {[
            {
              icon: '◈',
              title: 'Categories & budgets',
              desc: 'Group expenses and set limits per category each month.',
            },
            {
              icon: '◎',
              title: 'Receipt storage',
              desc: 'Upload and attach receipts directly to any expense via S3.',
            },
            {
              icon: '◉',
              title: 'Smart alerts',
              desc: 'Get notified when you approach or exceed a budget.',
            },
          ].map((f) => (
            <div key={f.title} className="text-left sm:text-center">
              <span className="text-lg text-[#1A1A1A]">{f.icon}</span>
              <h3 className="mt-3 mb-1 text-sm font-medium text-[#1A1A1A]">{f.title}</h3>
              <p className="text-sm leading-relaxed text-[#888]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="shrink-0 border-t border-[#E5E4E0] px-6 py-5 sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-xs text-[#AAA] sm:flex-row">
          <span>Expense Tracker — local dev</span>
          <span>Next.js · Express · PostgreSQL · AWS</span>
        </div>
      </footer>
    </main>
  );
}
