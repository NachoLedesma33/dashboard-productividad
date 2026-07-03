import { useState, useEffect } from 'react';
import type Dexie from 'dexie';
import { getDb } from '@/db/lazyDb';

interface UseDatabaseReturn {
  db: Dexie | null;
  isLoading: boolean;
  error: Error | null;
  resetDatabase: () => Promise<void>;
}

let dbInitialized = false;

export function useDatabase(): UseDatabaseReturn {
  const [db, setDb] = useState<Dexie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const resetDatabase = async () => {
    const m = await getDb();
    await m.db.delete();
    await m.db.open();
    dbInitialized = false;
    setIsLoading(true);
  };

  useEffect(() => {
    if (dbInitialized) return;

    getDb()
      .then((m) => {
        setDb(m.db);
        dbInitialized = true;
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, []);

  return { db, isLoading, error, resetDatabase };
}
