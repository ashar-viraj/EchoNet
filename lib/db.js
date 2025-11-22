import { Pool } from "pg";

let pool;

export function getDb() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required to connect to Postgres.");
  }
  pool = new Pool({ connectionString });
  return pool;
}

export async function query(text, params) {
  const client = getDb();
  const res = await client.query(text, params);
  return res;
}
