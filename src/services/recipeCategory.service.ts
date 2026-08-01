import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta, getPagination } from "../utils/pagination";
import {
  CreateRecipeCategoryInput,
  UpdateRecipeCategoryInput,
} from "../validators/recipeCategory.validator";

interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  parentCategoryId?: string;
}

export const recipeCategoryService = {
  async list(query: ListQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.RecipeCategoryWhereInput = {
      ...(query.search && {
        recipeCategoryName: { contains: query.search, mode: "insensitive" },
      }),
      ...(query.parentCategoryId && { parentCategoryId: query.parentCategoryId }),
    };

    const [items, total] = await Promise.all([
      prisma.recipeCategory.findMany({
        where,
        skip,
        take,
        orderBy: { recipeCategoryName: "asc" },
        include: { parent: true },
      }),
      prisma.recipeCategory.count({ where }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async getById(id: string) {
    const category = await prisma.recipeCategory.findUnique({
      where: { recipeCategoryId: id },
      include: { parent: true, children: true },
    });
    if (!category) throw ApiError.notFound("Không tìm thấy danh mục công thức");
    return category;
  },

  async create(input: CreateRecipeCategoryInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      if (input.parentCategoryId) {
        const parent = await tx.recipeCategory.findUnique({
          where: { recipeCategoryId: input.parentCategoryId },
        });
        if (!parent) throw ApiError.badRequest("parentCategoryId không tồn tại");
      }

      const duplicate = await tx.recipeCategory.findFirst({
        where: {
          recipeCategoryName: input.recipeCategoryName,
          parentCategoryId: input.parentCategoryId ?? null,
        },
      });
      if (duplicate) {
        throw ApiError.conflict("Danh mục với tên và danh mục cha này đã tồn tại");
      }

      return tx.recipeCategory.create({
        data: {
          recipeCategoryName: input.recipeCategoryName,
          parentCategoryId: input.parentCategoryId ?? null,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    });
  },

  async update(id: string, input: UpdateRecipeCategoryInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.recipeCategory.findUnique({
        where: { recipeCategoryId: id },
      });
      if (!existing) throw ApiError.notFound("Không tìm thấy danh mục công thức");

      if (input.parentCategoryId === id) {
        throw ApiError.badRequest("Danh mục không thể là cha của chính nó");
      }

      return tx.recipeCategory.update({
        where: { recipeCategoryId: id },
        data: {
          ...(input.recipeCategoryName !== undefined && {
            recipeCategoryName: input.recipeCategoryName,
          }),
          ...(input.parentCategoryId !== undefined && {
            parentCategoryId: input.parentCategoryId,
          }),
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });
    });
  },

  async remove(id: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.recipeCategory.findUnique({
        where: { recipeCategoryId: id },
        include: { children: true },
      });
      if (!existing) throw ApiError.notFound("Không tìm thấy danh mục công thức");

      if (existing.children.length > 0) {
        throw ApiError.badRequest(
          "Không thể xoá danh mục đang có danh mục con, hãy xoá/di chuyển danh mục con trước"
        );
      }

      await tx.recipeRecipeCategory.deleteMany({ where: { recipeCategoryId: id } });
      await tx.recipeCategory.delete({ where: { recipeCategoryId: id } });

      return { id };
    });
  },
};
