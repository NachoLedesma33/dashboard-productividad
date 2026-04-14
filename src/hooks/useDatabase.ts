import { useState, useEffect } from 'react';
import Dexie from 'dexie';
import { db } from '@/db/database';

interface UseDatabaseReturn {
  db: Dexie;
  isLoading: boolean;
  error: Error | null;
  resetDatabase: () => Promise<void>;
}

let dbInitialized = false;
let initPromise: Promise<void> | null = null;

export function useDatabase(): UseDatabaseReturn {
  const [isLoading, setIsLoading] = useState(!dbInitialized);
  const [error, setError] = useState<Error | null>(null);

  const resetDatabase = async () => {
    await db.delete();
    db.open();
    dbInitialized = false;
  };

  useEffect(() => {
    if (dbInitialized) {
      setIsLoading(false);
      return;
    }

    if (!initPromise) {
      initPromise = db.open().then(() => {
        dbInitialized = true;
        setIsLoading(false);
      }).catch((err) => {
        setError(err);
        setIsLoading(false);
      });
    }

    initPromise.catch(() => {});
  }, []);

  return { db, isLoading, error, resetDatabase };
}