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
let initPromise: Promise<void> | null = null;

export function useDatabase(): UseDatabaseReturn {
  const [db, setDb] = useState<Dexie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const resetDatabase = async () => {
    const m = await getDb();
    await m.db.delete();
    m.db.open();
    dbInitialized = false;
    setIsLoading(true);
  };

  useEffect(() => {
    if (dbInitialized) return;

    if (!initPromise) {
      initPromise = getDb().then((m) => {
        setDb(m.db);
        return m.db.open().then(() => {
          dbInitialized = true;
          setIsLoading(false);
        });
      }).catch((err) => {
        setError(err);
        setIsLoading(false);
      });
    }

    initPromise.catch(() => {});
  }, []);

  return { db, isLoading, error, resetDatabase };
}
