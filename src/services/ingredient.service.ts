import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta, getPagination } from "../utils/pagination";
import {
  CreateIngredientInput,
  UpdateIngredientInput,
} from "../validators/ingredient.validator";

interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
}

async function ensureCategoriesExist(
  tx: Prisma.TransactionClient,
  categoryIds: string[],
) {
  if (categoryIds.length === 0) return;
  const count = await tx.category.count({
    where: { categoryId: { in: categoryIds } },
  });
  if (count !== categoryIds.length) {
    throw ApiError.badRequest("Một hoặc nhiều categoryIds không tồn tại");
  }
}

export const ingredientService = {
  async list(query: ListQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.IngredientWhereInput = {
      ...(query.search && {
        ingredientName: { contains: query.search, mode: "insensitive" },
      }),
      ...(query.categoryId && {
        categoryLinks: { some: { categoryId: query.categoryId } },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.ingredient.findMany({
        where,
        skip,
        take,
        orderBy: { ingredientName: "asc" },
        include: { categoryLinks: { include: { category: true } } },
      }),
      prisma.ingredient.count({ where }),
    ]);

    return {
      items: items.map(ingredientService.formatIngredient),
      meta: buildMeta(total, page, limit),
    };
  },

  async getById(id: string) {
    const ingredient = await prisma.ingredient.findUnique({
      where: { ingredientId: id },
      include: { categoryLinks: { include: { category: true } } },
    });
    if (!ingredient) throw ApiError.notFound("Không tìm thấy nguyên liệu");
    return ingredientService.formatIngredient(ingredient);
  },

  formatIngredient(ingredient: any) {
    const { categoryLinks, ...rest } = ingredient;
    return {
      ...rest,
      categories: categoryLinks?.map((link: any) => link.category) ?? [],
    };
  },

  async create(input: CreateIngredientInput, userId: string) {
    return prisma
      .$transaction(async (tx) => {
        await ensureCategoriesExist(tx, input.categoryIds ?? []);

        const ingredient = await tx.ingredient.create({
          data: {
            ingredientName: input.ingredientName,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        if (input.categoryIds && input.categoryIds.length > 0) {
          await tx.ingredientCategoryLink.createMany({
            data: input.categoryIds.map((categoryId) => ({
              ingredientId: ingredient.ingredientId,
              categoryId: categoryId,
            })),
          });
        }

        return tx.ingredient.findUniqueOrThrow({
          where: { ingredientId: ingredient.ingredientId },
          include: { categoryLinks: { include: { category: true } } },
        });
      })
      .then(ingredientService.formatIngredient);
  },

  async update(id: string, input: UpdateIngredientInput, userId: string) {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.ingredient.findUnique({
        where: { ingredientId: id },
      });
      if (!existing) throw ApiError.notFound("Không tìm thấy nguyên liệu");

      if (input.categoryIds) {
        await ensureCategoriesExist(tx, input.categoryIds);
        // Thay toàn bộ liên kết category bằng danh sách mới
        await tx.ingredientCategoryLink.deleteMany({
          where: { ingredientId: id },
        });
        if (input.categoryIds.length > 0) {
          await tx.ingredientCategoryLink.createMany({
            data: input.categoryIds.map((categoryId) => ({
              ingredientId: id,
              categoryId: categoryId,
            })),
          });
        }
      }

      await tx.ingredient.update({
        where: { ingredientId: id },
        data: {
          ...(input.ingredientName !== undefined && {
            ingredientName: input.ingredientName,
          }),
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });

      return tx.ingredient.findUniqueOrThrow({
        where: { ingredientId: id },
        include: { categoryLinks: { include: { category: true } } },
      });
    });

    return ingredientService.formatIngredient(result);
  },

  async remove(id: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.ingredient.findUnique({
        where: { ingredientId: id },
      });
      if (!existing) throw ApiError.notFound("Không tìm thấy nguyên liệu");

      const usedInRecipe = await tx.recipeIngredient.findFirst({
        where: { ingredientId: id },
      });
      if (usedInRecipe) {
        throw ApiError.badRequest(
          "Không thể xoá nguyên liệu đang được dùng trong công thức nấu ăn",
        );
      }

      await tx.ingredientCategoryLink.deleteMany({
        where: { ingredientId: id },
      });
      await tx.userIngredient.deleteMany({ where: { ingredientId: id } });
      await tx.ingredient.delete({ where: { ingredientId: id } });

      return { id };
    });
  },
};
