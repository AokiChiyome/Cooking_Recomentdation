-- AlterTable: Add user_role column to users table
ALTER TABLE users ADD COLUMN user_role VARCHAR(50) NOT NULL DEFAULT 'USER';

-- AlterTable: Rename khau_phan to khau_phan (with mapping), add recipe_image
ALTER TABLE recipes
ADD COLUMN recipe_image VARCHAR(255);

-- Copy existing hinh_anh data to recipe_image if needed
UPDATE recipes SET recipe_image = hinh_anh WHERE hinh_anh IS NOT NULL;

-- Update existing khau_phan values if any (they stay mapped via @map)
-- No action needed as Prisma handles @map transparently
