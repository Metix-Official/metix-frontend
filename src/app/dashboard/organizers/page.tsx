'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OrganizersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/users');
  }, [router]);

  return null;
}
