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

// 1. Kiểm tra xem biến môi trường có tồn tại không
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in .env file");
}

// 2. Chống việc tạo quá nhiều connection pool khi nodemon restart
declare global {
  var __pool: Pool | undefined;
}

const connectionString = process.env.DATABASE_URL;

// Debug: In ra để kiểm tra xem nó có đọc được URL không (có thể xóa sau khi chạy được)
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
  // log: ["query", "error", "warn"], // Bật cái này nếu muốn soi câu lệnh SQL
});
