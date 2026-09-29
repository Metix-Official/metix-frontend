'use client';

import React, { useState, useEffect } from 'react';
import { getStoredUser, UserProfile, fetchUserProfile } from '@/lib/api';
import { getUserRole, ROLES } from '@/lib/roles';
import { EoEventsView } from './EoEventsView';
import { OwnerMasterEventsView } from './OwnerMasterEventsView';
import { Loader2 } from 'lucide-react';

export default function EventsDispatcherPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const localUser = getStoredUser();
    setUser(localUser);
    setIsReady(true);

    // Refresh profile asynchronously if needed
    fetchUserProfile().then((fresh) => {
      if (fresh) setUser(fresh);
    });
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const role = getUserRole(user);

  // Jika Owner: Tampilkan Tabel Master Event (Gambar 2)
  if (role === ROLES.OWNER) {
    return <OwnerMasterEventsView />;
  }

  // Jika EO / lainnya: Tampilkan Manajemen Event Saya untuk EO (Gambar 1)
  return <EoEventsView />;
}
