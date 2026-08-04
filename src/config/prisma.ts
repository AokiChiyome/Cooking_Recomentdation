import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env file");
}

declare global {
  var __pool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;
console.log(
  "Connecting to DB at:",
  connectionString.split("@")[1] || "Check your URL",
);

const pool = global.__pool || new Pool({ connectionString });

if (process.env.NODE_ENV !== "production") {
  global.__pool = pool;
}

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ["query", "error", "warn"],
});
