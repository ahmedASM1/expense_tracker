import Link from 'next/link';
import DevModeBanner from './DevModeBanner';
import Logo from './Logo';

type AuthPageShellProps = {
  children: React.ReactNode;
  footerLink: { label: string; href: string; text: string };
};

export default function AuthPageShell({ children, footerLink }: AuthPageShellProps) {
  return (
    <main className="flex min-h-screen flex-col bg-[#FAFAF9]">
      <DevModeBanner />
      <nav className="shrink-0 border-b border-[#E5E4E0] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <Logo href="/" />
          <span className="shrink-0 text-sm text-[#888]">
            {footerLink.text}{' '}
            <Link href={footerLink.href} className="font-medium text-[#1A1A1A] hover:underline">
              {footerLink.label}
            </Link>
          </span>
        </div>
      </nav>

      <div className="flex flex-1 items-center justify-center px-6 py-12 sm:py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </main>
  );
}
