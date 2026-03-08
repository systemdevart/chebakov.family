'use client';

import { useEffect, useState } from 'react';
import { useFamilyStore } from '@/store/familyStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  const { fetchData, isLoading } = useFamilyStore();
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!hasFetched) {
      fetchData();
      setHasFetched(true);
    }
  }, [fetchData, hasFetched]);

  if (isLoading && !hasFetched) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Загрузка...</p>
      </div>
    );
  }

  return <>{children}</>;
}
