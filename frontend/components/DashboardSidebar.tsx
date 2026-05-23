'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import {
  IconAccount,
  IconBudgets,
  IconCategories,
  IconExpenses,
  IconOverview,
} from '@/components/SidebarIcons';
import { authApi, type User } from '@/lib/api';

const links = [
  { href: '/dashboard', label: 'Overview', Icon: IconOverview, exact: true },
  { href: '/dashboard/expenses', label: 'Expenses', Icon: IconExpenses },
  { href: '/dashboard/categories', label: 'Categories', Icon: IconCategories },
  { href: '/dashboard/budgets', label: 'Budgets', Icon: IconBudgets },
] as const;

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    authApi.me().then(setUser).catch(() => setUser(null));
  }, [pathname]);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function linkClass(active: boolean) {
    return `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
      active
        ? 'bg-[#F0EFEB] font-medium text-[#1A1A1A]'
        : 'text-[#888] hover:bg-[#FAFAF9] hover:text-[#1A1A1A]'
    }`;
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E5E4E0] bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-md p-2 text-[#555] hover:bg-[#FAFAF9]"
          aria-label="Open menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Logo href="/dashboard" size={32} />
        <div className="w-9" />
      </header>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-[#E5E4E0] bg-white transition-transform duration-200 lg:relative lg:z-auto lg:min-h-screen lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="border-b border-[#E5E4E0] p-5">
          <Logo href="/dashboard" size={36} />
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {links.map(({ href, label, Icon, exact }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={linkClass(isActive(href, exact))}
            >
              <Icon />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-[#E5E4E0] p-3">
          <Link
            href="/dashboard/account"
            onClick={() => setOpen(false)}
            className={linkClass(isActive('/dashboard/account', true))}
          >
            <IconAccount />
            <div className="min-w-0 flex-1">
              <span className="block">Account</span>
              {user && (
                <span className="block truncate text-xs font-normal text-[#AAA]">
                  {user.full_name}
                </span>
              )}
            </div>
          </Link>
        </div>
      </aside>
    </>
  );
}
