-- ================================================================
-- DROP TABLE
-- ================================================================

DROP TABLE IF EXISTS
    _UserRoles,
    recipe_categories,
    recipe_ingredients,
    recipe_steps,
    user_ingredients,
    ingredient_category,
    ingredients,
    categories,
    units,
    recipes,
    refresh_tokens,
    "Role",
    users
CASCADE;


-- ================================================================
-- USERS
-- ================================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    first_name STRING NOT NULL,
    last_name STRING,
    email STRING NOT NULL UNIQUE,
    password STRING NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID NOT NULL
);


-- ================================================================
-- ROLE
-- ================================================================

CREATE TABLE "Role" (
    role_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    role_name STRING NOT NULL UNIQUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID NOT NULL
);


-- ================================================================
-- USER <-> ROLE
-- Prisma implicit many-to-many table
-- ================================================================

CREATE TABLE "_UserRoles" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    PRIMARY KEY ("A", "B"),

    CONSTRAINT "_UserRoles_A_fkey"
        FOREIGN KEY ("A")
        REFERENCES "Role"(role_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT "_UserRoles_B_fkey"
        FOREIGN KEY ("B")
        REFERENCES users(user_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX "_UserRoles_B_index"
ON "_UserRoles"("B");


-- ================================================================
-- CATEGORIES
-- ================================================================

CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    category_name STRING NOT NULL,
    parent_category_id UUID,
    category_type STRING,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID NOT NULL
);

ALTER TABLE categories
ADD CONSTRAINT fk_parent_category
FOREIGN KEY (parent_category_id)
REFERENCES categories(category_id);

ALTER TABLE categories
ADD CONSTRAINT fk_created_by_users
FOREIGN KEY (created_by)
REFERENCES users(user_id);

ALTER TABLE categories
ADD CONSTRAINT fk_updated_by_users
FOREIGN KEY (updated_by)
REFERENCES users(user_id);


-- ================================================================
-- INGREDIENTS
-- ================================================================

CREATE TABLE ingredients (
    ingredient_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ingredient_name STRING NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID NOT NULL
);

ALTER TABLE ingredients
ADD CONSTRAINT fk_ingredients_created_by_users
FOREIGN KEY (created_by)
REFERENCES users(user_id);

ALTER TABLE ingredients
ADD CONSTRAINT fk_ingredients_updated_by_users
FOREIGN KEY (updated_by)
REFERENCES users(user_id);


-- ================================================================
-- INGREDIENT CATEGORY
-- ================================================================

CREATE TABLE ingredient_category (
    ingredient_id UUID NOT NULL,
    category_id UUID NOT NULL,

    PRIMARY KEY (
        ingredient_id,
        category_id
    ),

    CONSTRAINT fk_ingredientCategory_ingredient
        FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(ingredient_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ingredient_categories
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE CASCADE
);


-- ================================================================
-- RECIPES
-- ================================================================

CREATE TABLE recipes (
    recipe_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recipe_name STRING NOT NULL,
    recipe_description STRING,

    cook_time INT NOT NULL,

    khau_phan STRING,
    hinh_anh STRING,

    difficulty CHAR(1) NOT NULL DEFAULT '0',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID,

    CONSTRAINT fk_recipesCreatedBy_users
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recipesUpdatedBy_users
        FOREIGN KEY (updated_by)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- ================================================================
-- UNITS
-- ================================================================

CREATE TABLE units (
    unit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    unit_name STRING NOT NULL,
    symbol STRING NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID NOT NULL,

    CONSTRAINT uq_units_name
        UNIQUE (unit_name),

    CONSTRAINT uq_units_symbol
        UNIQUE (symbol)
);


-- ================================================================
-- RECIPE INGREDIENTS
-- ================================================================

CREATE TABLE recipe_ingredients (
    recipe_id UUID NOT NULL,
    ingredient_id UUID NOT NULL,

    quantity DECIMAL NOT NULL,

    unit_id UUID,

    PRIMARY KEY (
        recipe_id,
        ingredient_id
    ),

    CONSTRAINT fk_recipe
        FOREIGN KEY (recipe_id)
        REFERENCES recipes(recipe_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ingredient
        FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(ingredient_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recipe_ingredients_unit
        FOREIGN KEY (unit_id)
        REFERENCES units(unit_id)
        ON DELETE RESTRICT
);


-- ================================================================
-- RECIPE STEPS
-- ================================================================

CREATE TABLE recipe_steps (
    step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recipe_id UUID,

    step_number INT NOT NULL,
    description STRING NOT NULL,

    CONSTRAINT recipe_steps_recipe_id_fkey
        FOREIGN KEY (recipe_id)
        REFERENCES recipes(recipe_id)
        ON DELETE CASCADE,

    CONSTRAINT recipe_steps_recipe_id_step_number_key
        UNIQUE (
            recipe_id,
            step_number
        )
);


-- ================================================================
-- USER INGREDIENTS
-- ================================================================

CREATE TABLE user_ingredients (
    user_id UUID NOT NULL,
    ingredient_id UUID NOT NULL,

    quantity DECIMAL,

    unit_id UUID,

    PRIMARY KEY (
        user_id,
        ingredient_id
    ),

    CONSTRAINT user_ingredients_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT user_ingredients_ingredient_id_fkey
        FOREIGN KEY (ingredient_id)
        REFERENCES ingredients(ingredient_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_ingredients_unit
        FOREIGN KEY (unit_id)
        REFERENCES units(unit_id)
        ON DELETE RESTRICT
);


-- ================================================================
-- RECIPE CATEGORIES
-- ================================================================

CREATE TABLE recipe_categories (
    recipe_id UUID NOT NULL,
    category_id UUID NOT NULL,

    PRIMARY KEY (
        recipe_id,
        category_id
    ),

    CONSTRAINT fk_recipe_categories_recipe
        FOREIGN KEY (recipe_id)
        REFERENCES recipes(recipe_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recipe_categories_category
        FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON DELETE CASCADE
);


-- ================================================================
-- REFRESH TOKENS
-- ================================================================

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    token STRING NOT NULL UNIQUE,

    user_id UUID NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    revoked BOOL NOT NULL DEFAULT false,

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);


-- ================================================================
-- INDEXES
-- ================================================================

CREATE INDEX idx_categories_parent
ON categories(parent_category_id);


CREATE INDEX idx_ingredients_created_by
ON ingredients(created_by);


CREATE INDEX idx_ingredients_updated_by
ON ingredients(updated_by);


CREATE INDEX idx_ingredient_category
ON ingredient_category(category_id);


CREATE INDEX idx_recipes_created_by
ON recipes(created_by);


CREATE INDEX idx_recipes_updated_by
ON recipes(updated_by);


CREATE INDEX idx_user_ingredients_ingredient
ON user_ingredients(ingredient_id);


CREATE INDEX "_UserRoles_B_index"
ON "_UserRoles"("B");