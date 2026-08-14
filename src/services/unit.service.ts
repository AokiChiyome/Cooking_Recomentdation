import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import { buildMeta, getPagination } from "../utils/pagination";
import { CreateUnitInput, UpdateUnitInput } from "../validators/unit.validator";

interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export const unitService = {
  async list(query: ListQuery) {
    const { skip, take, page, limit } = getPagination(query);

    const where: Prisma.UnitWhereInput = query.search
      ? {
          OR: [
            { unitName: { contains: query.search, mode: "insensitive" } },
            { symbol: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.unit.findMany({ where, skip, take, orderBy: { unitName: "asc" } }),
      prisma.unit.count({ where }),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async getById(id: string) {
    const unit = await prisma.unit.findUnique({ where: { unitId: id } });
    if (!unit) throw ApiError.notFound("Không tìm thấy đơn vị");
    return unit;
  },

  async create(input: CreateUnitInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.unit.findFirst({
        where: {
          OR: [
            {
              unitName: {
                equals: input.unitName,
                mode: "insensitive",
              },
            },
            {
              symbol: {
                equals: input.symbol,
                mode: "insensitive",
              },
            },
          ],
        },
      });
      if (existing) {
        throw ApiError.conflict("Tên đơn vị hoặc ký hiệu đã tồn tại");
      }

      return tx.unit.create({
        data: {
          unitName: input.unitName,
          symbol: input.symbol,
          createdBy: userId,
          updatedBy: userId,
        },
      });
    });
  },

  async update(id: string, input: UpdateUnitInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.unit.findUnique({ where: { unitId: id } });
      if (!existing) throw ApiError.notFound("Không tìm thấy đơn vị");

      if (input.unitName || input.symbol) {
        const duplicate = await tx.unit.findFirst({
          where: {
            unitId: { not: id },
            OR: [
              ...(input.unitName ? [{ unitName: input.unitName }] : []),
              ...(input.symbol ? [{ symbol: input.symbol }] : []),
            ],
          },
        });
        if (duplicate) {
          throw ApiError.conflict("Tên đơn vị hoặc ký hiệu đã tồn tại");
        }
      }

      return tx.unit.update({
        where: { unitId: id },
        data: {
          ...(input.unitName !== undefined && { unitName: input.unitName }),
          ...(input.symbol !== undefined && { symbol: input.symbol }),
          updatedBy: userId,
          updatedAt: new Date(),
        },
      });
    });
  },

  async remove(id: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.unit.findUnique({ where: { unitId: id } });
      if (!existing) throw ApiError.notFound("Không tìm thấy đơn vị");

      const usedInRecipe = await tx.recipeIngredient.findFirst({
        where: { unitId: id },
      });
      const usedInPantry = await tx.userIngredient.findFirst({
        where: { unitId: id },
      });
      if (usedInRecipe || usedInPantry) {
        throw ApiError.badRequest("Không thể xoá đơn vị đang được sử dụng");
      }

      await tx.unit.delete({ where: { unitId: id } });
      return { id };
    });
  },
};
