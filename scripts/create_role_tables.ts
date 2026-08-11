import "dotenv/config";
import { prisma } from "../src/config/prisma";

async function main() {
  console.log("Creating Role and _UserRoles tables in CockroachDB...");

  // 1. Create Role table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Role" (
      role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      role_name STRING NOT NULL UNIQUE,
      created_at TIMESTAMPTZ DEFAULT now(),
      created_by UUID NOT NULL DEFAULT '690d729c-64ad-4d7b-a984-b013016eaf66',
      updated_at TIMESTAMPTZ DEFAULT now(),
      updated_by UUID NOT NULL DEFAULT '690d729c-64ad-4d7b-a984-b013016eaf66'
    );
  `);

  // 2. Create _UserRoles implicit join table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_UserRoles" (
      "A" UUID NOT NULL REFERENCES "Role"(role_id) ON DELETE CASCADE ON UPDATE CASCADE,
      "B" UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "_UserRoles_AB_pkey" PRIMARY KEY ("A", "B")
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "_UserRoles_B_index" ON "_UserRoles"("B");
  `);

  // 3. Seed default roles ADMIN and USER if not exists
  await prisma.$executeRawUnsafe(`
    INSERT INTO "Role" (role_name) VALUES ('ADMIN'), ('USER') ON CONFLICT (role_name) DO NOTHING;
  `);

  console.log("✅ Role and _UserRoles tables created and seeded successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
