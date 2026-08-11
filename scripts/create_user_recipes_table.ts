import "dotenv/config";
import { prisma } from "../src/config/prisma";

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS user_recipes (
      user_id UUID NOT NULL,
      recipe_id UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      PRIMARY KEY (user_id, recipe_id),
      CONSTRAINT fk_user_recipes_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      CONSTRAINT fk_user_recipes_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
    );
  `);
  console.log('✅ user_recipes table created successfully!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
