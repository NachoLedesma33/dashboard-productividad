let mod: Promise<typeof import("./database")> | null = null;

export function getDb(): Promise<typeof import("./database")> {
  if (!mod) mod = import("./database");
  return mod;
}
