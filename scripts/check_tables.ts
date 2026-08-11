import "dotenv/config";
import { prisma } from "../src/config/prisma";

async function main() {
  const tables: any = await prisma.$queryRaw`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
  `;
  console.log("Current DB Tables in CockroachDB:");
  tables.forEach((t: any) => console.log("-", t.table_name));
}

main().catch(console.error).finally(() => prisma.$disconnect());
