'use client';

import { isDevAuthMode } from '@/lib/auth';

export default function DevModeBanner() {
  if (!isDevAuthMode()) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900">
      Dev mode — any email/password works. AWS Cognito not required.
    </div>
  );
}
