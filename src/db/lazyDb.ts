let dbReady: Promise<typeof import("./database")> | null = null;

export function getDb(): Promise<typeof import("./database")> {
  if (!dbReady) {
    dbReady = import("./database").then((m) =>
      m.db.open().then(() => m)
    ).catch((err) => {
      console.error("[LazyDb] Failed to load or open database:", err);
      dbReady = null;
      throw err;
    });
  }
  return dbReady;
}
