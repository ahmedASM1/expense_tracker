import Link from 'next/link';
import Image from 'next/image';

type LogoProps = {
  href?: string;
  showText?: boolean;
  size?: number;
};

export default function Logo({ href, showText = true, size = 28 }: LogoProps) {
  const image = (
    <Image
      src="/logo.svg"
      alt="Expense Tracker"
      width={size}
      height={size}
      className="shrink-0 rounded-xl"
      priority
      unoptimized
    />
  );

  const content = (
    <>
      {image}
      {showText && (
        <span className="truncate text-sm font-medium tracking-wide text-[#1A1A1A]">
          Expense Tracker
        </span>
      )}
    </>
  );

  const className = 'flex min-w-0 items-center gap-2.5';

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
