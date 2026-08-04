import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta, getPagination } from "../utils/pagination";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validators/category.validator";

interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
  parentCategoryId?: string;
}

export const categoryService = {
  async list(query: ListQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.CategoryWhereInput = {
      ...(query.search && {
        categoryName: {
          contains: query.search,
          mode: "insensitive",
        },
      }),
      ...(query.parentCategoryId && {
        parentCategoryId: query.parentCategoryId,
      }),
    };

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy: { categoryName: "asc" },
        include: { parent: true },
      }),
      prisma.category.count({ where }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { categoryId: id },
      include: { parent: true, children: true },
    });
    if (!category)
      throw ApiError.notFound("Không tìm thấy danh mục nguyên liệu");
    return category;
  },

  async create(input: CreateCategoryInput, userId: string) {
    if (input.parentCategoryId) {
      await categoryService.ensureExists(input.parentCategoryId);
    }

    return prisma.$transaction(async (tx) => {
      return tx.category.create({
        data: {
          categoryName: input.ingredientCategoryName,
          parentCategoryId: input.parentCategoryId ?? null,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    });
  },

  async update(id: string, input: UpdateCategoryInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.category.findUnique({
        where: { categoryId: id },
      });
      if (!existing)
        throw ApiError.notFound("Không tìm thấy danh mục nguyên liệu");

      if (input.parentCategoryId) {
        if (input.parentCategoryId === id) {
          throw ApiError.badRequest("Danh mục không thể là cha của chính nó");
        }
        const parent = await tx.category.findUnique({
          where: { categoryId: input.parentCategoryId },
        });
        if (!parent)
          throw ApiError.badRequest("parentCategoryId không tồn tại");
      }

      return tx.category.update({
        where: { categoryId: id },
        data: {
          ...(input.ingredientCategoryName !== undefined && {
            ingredientCategoryName: input.ingredientCategoryName,
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
      const existing = await tx.category.findUnique({
        where: { categoryId: id },
        include: { children: true, ingredientLinks: true },
      });
      if (!existing)
        throw ApiError.notFound("Không tìm thấy danh mục nguyên liệu");

      if (existing.children.length > 0) {
        throw ApiError.badRequest(
          "Không thể xoá danh mục đang có danh mục con, hãy xoá/di chuyển danh mục con trước",
        );
      }

      // ingredient_category có onDelete cascade nên record liên kết sẽ tự xoá,
      // xoá tường minh trong transaction để đảm bảo tính nhất quán/rõ ràng.
      await tx.ingredientCategoryLink.deleteMany({
        where: { categoryId: id },
      });

      await tx.category.delete({ where: { categoryId: id } });

      return { id };
    });
  },

  async ensureExists(id: string) {
    const found = await prisma.category.findUnique({
      where: { categoryId: id },
    });
    if (!found) throw ApiError.badRequest("parentCategoryId không tồn tại");
  },
};
