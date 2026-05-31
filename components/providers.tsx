'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SessionProvider>
      {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
    </SessionProvider>
  );
}