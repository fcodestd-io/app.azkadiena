import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "./schema";

// 1. Tambahkan WebSocket constructor
neonConfig.webSocketConstructor = ws;

// 2. Gunakan Pool untuk mendukung fitur transaksi
const pool = new Pool({ connectionString: process.env.DATABASE_URL! });

export const db = drizzle(pool, { schema });
