drop table if exists
    recipe_recipe_categories,
    recipe_categories,
    recipe_ingredients,
    recipe_steps,
    user_ingredients,
    ingredient_category,
    ingredients,
    categories,
    units,
    recipes,
    users,
    refresh_tokens 
cascade;

create table users (
    user_id UUID primary key default gen_random_uuid(),

    first_name string not null,
    last_name string,
    email string not null unique,
    password string not null,

    created_at timestamptz not null default now(),
    created_by UUID not null,
    updated_at timestamptz not null default now(),
    updated_by UUID not null
);
-- ==================================================================
create table categories (
	category_id UUID primary key default gen_random_uuid(),
	category_name string not null,
	parent_category_id UUID,
	category_type STRING,
	
	created_at timestamptz not null default now(),
    created_by UUID not null,
    updated_at timestamptz not null default now(),
    updated_by UUID not null
);

alter table categories 
add constraint fk_parent_category
foreign key (parent_category_id)
references categories(category_id);

alter table categories 
add constraint fk_created_by_users
foreign key (created_by)
references users(user_id);

alter table categories 
add constraint fk_updated_by_users
foreign key (updated_by)
references users(user_id);
-- ==================================================================
create table ingredients (
	ingredient_id UUID primary key default gen_random_uuid(),
	ingredient_name string not null,
	
	
	created_at timestamptz not null default now(),
    created_by UUID,
    updated_at timestamptz not null default now(),
    updated_by UUID
);

alter table ingredients  
add constraint fk_ingredients_created_by_users
foreign key (created_by)
references users(user_id);

alter table ingredients 
add constraint fk_ingredients_updated_by_users
foreign key (updated_by)
references users(user_id);
-- ==================================================================
create table ingredient_category (
	ingredient_id UUID not null,
    category_id UUID not null,
    
    primary key (ingredient_id,
category_id),
    
    constraint fk_ingredientCategory_ingredient 
        foreign key (ingredient_id) 
        references ingredients(ingredient_id) 
        on
delete
    cascade,
    constraint fk_ingredient_categories
        foreign key (category_id) 
        references categories(category_id) 
        on
    delete
        cascade
);
-- ==================================================================
create table recipes (
    recipe_id UUID primary key default gen_random_uuid(),
    recipe_name string not null,
    recipe_description string,
    cook_time INT not null,
    khau_phan STRING,
    hinh_anh STRING,
    difficulty CHAR(1) not null default '0',

    created_at timestamptz not null default now(),
    created_by UUID,
    updated_at timestamptz not null default now(),
    updated_by UUID,

    constraint fk_recipesCreatedBy_users
        foreign key (created_by)
        references users(user_id)
        on
delete
    cascade,
    constraint fk_recipesUpdatedBy_users
        foreign key (updated_by)
        references users(user_id)
        on
    delete
        cascade
);
-- ===
create table units (
    unit_id UUID primary key default gen_random_uuid(),

    unit_name string not null,
    symbol string not null,

    created_at timestamptz not null default now(),
    created_by UUID not null,

    updated_at timestamptz not null default now(),
    updated_by UUID not null,

    constraint uq_units_name unique (unit_name),
    constraint uq_units_symbol unique (symbol)
);
-- ==================================================================
create table recipe_ingredients (
    recipe_id UUID not null,
    ingredient_id UUID not null,
    
    quantity DECIMAL not null,
    unit_id UUID,

constraint fk_recipe_ingredients_unit
    foreign key (unit_id)
    references units(unit_id)
    on
delete
    restrict,
    primary key (recipe_id,
    ingredient_id),
    constraint fk_recipe
        foreign key (recipe_id)
        references recipes(recipe_id)
        on
    delete
        cascade,
        constraint fk_ingredient
        foreign key (ingredient_id)
        references ingredients(ingredient_id)
        on
        delete
            cascade
);
-- ==================================================================
create table recipe_steps (
    step_id UUID primary key default gen_random_uuid(),
    recipe_id UUID references recipes(recipe_id) on
delete
    cascade,
    step_number INT not null,
    description TEXT not null,
    unique (recipe_id,
    step_number)
);
-- ==================================================================
CREATE TABLE user_ingredients (
    user_id UUID NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    ingredient_id UUID NOT NULL
        REFERENCES ingredients(ingredient_id)
        ON DELETE CASCADE,

    quantity DECIMAL,

    unit_id UUID,

    PRIMARY KEY (user_id, ingredient_id),

    CONSTRAINT fk_user_ingredients_unit
        FOREIGN KEY (unit_id)
        REFERENCES units(unit_id)
        ON DELETE RESTRICT
);
-- ==================================================================
create table recipe_categories (
    recipe_id UUID not null,
    category_id UUID not null,

    created_at timestamptz not null default now(),
    created_by UUID not null,

    primary key (recipe_id,category_id),

    constraint fk_recipe_categories_recipe
        foreign key (recipe_id)
        references recipes(recipe_id)
        on
delete
    cascade,
    constraint fk_recipe_categories_category
        foreign key (category_id)
        references categories(category_id)
        on
    delete
        cascade
);
-- ===
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
-- ===
create index idx_ingredients_created_by
    on
ingredients(created_by);

create index idx_ingredients_updated_by
    on
ingredients(updated_by);

create index idx_recipes_created_by
    on
recipes(created_by);

create index idx_recipes_updated_by
    on
recipes(updated_by);

create index idx_ingredient_category
    on
ingredient_category(category_id);

create index idx_user_ingredients_ingredient
    on
user_ingredients(ingredient_id);

create index idx_categories_parent
    on
categories(parent_category_id);