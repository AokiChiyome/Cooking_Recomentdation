// import { PrismaClient } from "@prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";

// declare global {
//   // eslint-disable-next-line no-var
//   var __prisma__: PrismaClient | undefined;
// }

// const adapter = new PrismaPg({
//   connectionString: process.env.DATABASE_URL!,
// });

// export const prisma =
//   global.__prisma__ ??
//   new PrismaClient({
//     adapter,
//     log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
//   });

// if (process.env.NODE_ENV !== "production") {
//   global.__prisma__ = prisma;
// }

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});
