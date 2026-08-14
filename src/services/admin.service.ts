import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { buildMeta } from "../utils/pagination";
import { ApiError } from "../utils/ApiError";

interface ResolvedIngredient {
  ingredientId: string;
  quantity: string;
  unitId: string | null;
}

const parseQuantity = (
  value: unknown,
): {
  quantity: number;
  unitText?: string;
} => {
  const text = String(value ?? "").trim();

  if (!text) {
    return {
      quantity: 0,
    };
  }

  const match = text.match(/^([\d.,]+)\s*(.*)$/);

  if (!match) {
    throw ApiError.badRequest(`Số lượng nguyên liệu không hợp lệ: "${text}"`);
  }

  const quantity = Number(match[1].replace(",", "."));

  if (Number.isNaN(quantity)) {
    throw ApiError.badRequest(`Số lượng nguyên liệu không hợp lệ: "${text}"`);
  }

  const unitText = match[2].trim();

  return {
    quantity,
    unitText: unitText || undefined,
  };
};

async function resolveUnit(
  tx: Prisma.TransactionClient,
  unitText: string | undefined,
  userId: string,
): Promise<string | null> {
  if (!unitText) {
    return null;
  }

  const normalizedUnit = unitText.trim();

  if (!normalizedUnit) {
    return null;
  }

  let unit = await tx.unit.findFirst({
    where: {
      OR: [
        {
          unitName: {
            equals: normalizedUnit,
            mode: "insensitive",
          },
        },
        {
          symbol: {
            equals: normalizedUnit,
            mode: "insensitive",
          },
        },
      ],
    },
  });

  if (!unit) {
    unit = await tx.unit.create({
      data: {
        unitName: normalizedUnit,
        symbol: normalizedUnit,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  return unit.unitId;
}

async function resolveIngredients(
  tx: Prisma.TransactionClient,
  ingredients: any[],
  userId: string,
): Promise<ResolvedIngredient[]> {
  const resolvedIngredients: ResolvedIngredient[] = [];

  for (const item of ingredients) {
    const ingredientName = String(item.ingredientName ?? "").trim();

    if (!ingredientName) {
      continue;
    }

    let ingredient = await tx.ingredient.findFirst({
      where: {
        ingredientName: {
          equals: ingredientName,
          mode: "insensitive",
        },
      },
    });

    if (!ingredient) {
      ingredient = await tx.ingredient.create({
        data: {
          ingredientName,
        },
      });
    }

    const parsed = parseQuantity(item.quantity ?? item.amount);

    /*
     * Nếu frontend đã gửi unitId
     * thì dùng luôn.
     *
     * Nếu không có unitId thì
     * tìm / tạo Unit từ unitText.
     */

    let unitId: string | null = item.unitId ?? null;

    if (!unitId && parsed.unitText) {
      unitId = await resolveUnit(tx, parsed.unitText, userId);
    }

    resolvedIngredients.push({
      ingredientId: ingredient.ingredientId,
      quantity: parsed.quantity.toString(),
      unitId: item.unitId ?? null,
    });
  }

  return resolvedIngredients;
}

export const adminService = {
  async getStats() {
    const [
      totalRecipes,
      totalUsers,
      totalIngredients,
      totalCategories,
      totalUnits,
      avgCookTime,
    ] = await Promise.all([
      prisma.recipe.count(),
      prisma.user.count(),
      prisma.ingredient.count(),
      prisma.category.count(),
      prisma.unit.count(),
      prisma.recipe.aggregate({
        _avg: {
          cookTime: true,
        },
      }),
    ]);

    return {
      totalRecipes,
      totalUsers,
      totalIngredients,
      totalCategories,
      totalUnits,
      avgCookTimeMinutes: avgCookTime._avg.cookTime
        ? Math.round(avgCookTime._avg.cookTime)
        : 0,
    };
  },

  async getRecipes(page = 1, limit = 10, q = "") {
    const skip = (page - 1) * limit;
    const take = limit;

    const where = q
      ? {
          recipeName: {
            contains: q,
            mode: "insensitive" as const,
          },
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.recipe.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          createdByUser: {
            select: {
              userId: true,
              firstName: true,
              lastName: true,
            },
          },
          ingredients: {
            include: {
              ingredient: true,
              unit: true,
            },
          },
          steps: {
            orderBy: {
              stepNumber: "asc",
            },
          },
        },
      }),

      prisma.recipe.count({ where }),
    ]);

    const formatted = items.map((r: any) => ({
      recipeId: r.recipeId,
      recipeName: r.recipeName,
      recipeDescription: r.recipeDescription,

      hinh_anh: r.hinh_anh,
      recipeImage: r.hinh_anh,

      cookTime: r.cookTime,
      khauPhan: r.khau_phan || r.khauPhan || "2 người",

      difficulty: r.difficulty || "0",

      createdByUser: r.createdByUser
        ? `${r.createdByUser.firstName} ${
            r.createdByUser.lastName || ""
          }`.trim()
        : "Hệ thống",

      ingredientsCount: r.ingredients?.length ?? 0,

      stepsCount: r.steps?.length ?? 0,

      ingredients:
        r.ingredients?.map((ri: any) => ({
          ingredientId: ri.ingredientId,
          ingredientName: ri.ingredient?.ingredientName,
          quantity: ri.quantity,
          unit: ri.unit,
          unitId: ri.unitId,
        })) ?? [],

      steps:
        r.steps?.map((s: any) => ({
          stepId: s.stepId,
          stepNumber: s.stepNumber,
          description: s.description,
        })) ?? [],

      createdAt: r.createdAt,
    }));

    return {
      items: formatted,
      pagination: buildMeta(total, page, limit),
    };
  },

  async createRecipe(input: any, userId: string) {
    return prisma.$transaction(async (tx) => {
      /*
       * 1. Xử lý nguyên liệu
       *
       * Có rồi:
       *     lấy ingredientId
       *
       * Chưa có:
       *     tạo Ingredient mới
       */
      const ingredients = await resolveIngredients(
        tx,
        Array.isArray(input.ingredients) ? input.ingredients : [],
        userId,
      );

      /*
       * 2. Tạo Recipe
       */
      const recipe = await tx.recipe.create({
        data: {
          recipeName: input.recipeName,

          cookTime: input.cookTime || 15,

          khau_phan: input.khauPhan || "2 người",

          hinh_anh: input.recipeImage || input.hinh_anh || "",

          recipeDescription: input.recipeDescription || "",

          difficulty: input.difficulty || "0",

          ...(userId && {
            createdBy: userId,
            updatedBy: userId,
          }),
        },
      });

      /*
       * 3. Đăng ký nguyên liệu vào Recipe
       */
      if (ingredients.length > 0) {
        await tx.recipeIngredient.createMany({
          data: ingredients.map((ingredient) => ({
            recipeId: recipe.recipeId,

            ingredientId: ingredient.ingredientId,

            quantity: ingredient.quantity,

            unitId: ingredient.unitId,
          })),
        });
      }

      /*
       * 4. Tạo các bước nấu
       */
      if (Array.isArray(input.steps) && input.steps.length > 0) {
        await tx.recipeStep.createMany({
          data: input.steps.map((step: string | any, index: number) => ({
            recipeId: recipe.recipeId,

            stepNumber:
              typeof step === "object" && step.stepNumber
                ? step.stepNumber
                : index + 1,

            description:
              typeof step === "string" ? step : step.description || "",
          })),
        });
      }

      /*
       * 5. Trả về Recipe đầy đủ
       */
      return tx.recipe.findUniqueOrThrow({
        where: {
          recipeId: recipe.recipeId,
        },

        include: {
          ingredients: {
            include: {
              ingredient: true,
              unit: true,
            },
          },

          steps: {
            orderBy: {
              stepNumber: "asc",
            },
          },

          recipeCategories: {
            include: {
              category: true,
            },
          },
        },
      });
    });
  },

  async updateRecipe(id: string, input: any, userId: string) {
    return prisma.$transaction(async (tx) => {
      /*
       * 1. Kiểm tra Recipe tồn tại
       */
      const existing = await tx.recipe.findUnique({
        where: {
          recipeId: id,
        },
      });

      if (!existing) {
        throw new Error("Không tìm thấy công thức");
      }

      /*
       * 2. Nếu request có ingredients
       *    thì resolve ingredient trước.
       */
      let ingredients: {
        ingredientId: string;
        quantity: string;
        unitId: string | null;
      }[] = [];

      if (Array.isArray(input.ingredients)) {
        ingredients = await resolveIngredients(tx, input.ingredients, userId);
      }

      /*
       * 3. Update Recipe
       */
      await tx.recipe.update({
        where: {
          recipeId: id,
        },

        data: {
          ...(input.recipeName !== undefined && {
            recipeName: input.recipeName,
          }),

          ...(input.cookTime !== undefined && {
            cookTime: input.cookTime,
          }),

          ...(input.khauPhan !== undefined && {
            khau_phan: input.khauPhan,
          }),

          ...(input.recipeImage !== undefined && {
            hinh_anh: input.recipeImage,
          }),

          ...(input.hinh_anh !== undefined && {
            hinh_anh: input.hinh_anh,
          }),

          ...(input.recipeDescription !== undefined && {
            recipeDescription: input.recipeDescription,
          }),

          ...(input.difficulty !== undefined && {
            difficulty: input.difficulty,
          }),

          ...(userId && {
            updatedBy: userId,
            updatedAt: new Date(),
          }),
        },
      });

      /*
       * 4. Nếu có ingredients
       *    -> thay toàn bộ danh sách
       */
      if (Array.isArray(input.ingredients)) {
        await tx.recipeIngredient.deleteMany({
          where: {
            recipeId: id,
          },
        });

        if (ingredients.length > 0) {
          await tx.recipeIngredient.createMany({
            data: ingredients.map((ingredient) => ({
              recipeId: id,

              ingredientId: ingredient.ingredientId,

              quantity: ingredient.quantity,

              unitId: ingredient.unitId,
            })),
          });
        }
      }

      /*
       * 5. Nếu có steps
       *    -> thay toàn bộ steps
       */
      if (Array.isArray(input.steps)) {
        await tx.recipeStep.deleteMany({
          where: {
            recipeId: id,
          },
        });

        if (input.steps.length > 0) {
          await tx.recipeStep.createMany({
            data: input.steps.map((step: string | any, index: number) => ({
              recipeId: id,

              stepNumber:
                typeof step === "object" && step.stepNumber
                  ? step.stepNumber
                  : index + 1,

              description:
                typeof step === "string" ? step : step.description || "",
            })),
          });
        }
      }

      /*
       * 6. Trả về Recipe sau update
       */
      return tx.recipe.findUniqueOrThrow({
        where: {
          recipeId: id,
        },

        include: {
          ingredients: {
            include: {
              ingredient: true,
              unit: true,
            },
          },

          steps: {
            orderBy: {
              stepNumber: "asc",
            },
          },

          recipeCategories: {
            include: {
              category: true,
            },
          },
        },
      });
    });
  },

  async deleteRecipe(id: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.recipe.findUnique({
        where: {
          recipeId: id,
        },
      });

      if (!existing) {
        throw new Error("Không tìm thấy công thức");
      }

      // Xóa relations trước
      await tx.recipeIngredient.deleteMany({
        where: {
          recipeId: id,
        },
      });

      await tx.recipeStep.deleteMany({
        where: {
          recipeId: id,
        },
      });

      await tx.recipeCategory.deleteMany({
        where: {
          recipeId: id,
        },
      });

      await tx.userRecipe.deleteMany({
        where: {
          recipeId: id,
        },
      });

      return tx.recipe.delete({
        where: {
          recipeId: id,
        },
      });
    });
  },
};
