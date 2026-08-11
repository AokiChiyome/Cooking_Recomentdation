import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import {
  UpdateUserIngredientInput,
  UpsertUserIngredientInput,
} from "../validators/userIngredient.validator";

export const userIngredientService = {
  async listForUser(userId: string) {
    return prisma.userIngredient.findMany({
      where: { userId },
      include: { ingredient: true, unit: true },
      orderBy: { ingredient: { ingredientName: "asc" } },
    });
  },

  async getOne(userId: string, ingredientId: string) {
    const item = await prisma.userIngredient.findUnique({
      where: { userId_ingredientId: { userId, ingredientId } },
      include: { ingredient: true, unit: true },
    });
    if (!item) throw ApiError.notFound("Nguyên liệu này chưa có trong kho của bạn");
    return item;
  },

  async add(userId: string, input: UpsertUserIngredientInput) {
    return prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { ingredientId: input.ingredientId },
      });
      if (!ingredient) throw ApiError.badRequest("ingredientId không tồn tại");

      if (input.unitId) {
        const unit = await tx.unit.findUnique({ where: { unitId: input.unitId } });
        if (!unit) throw ApiError.badRequest("unitId không tồn tại");
      }

      const existing = await tx.userIngredient.findUnique({
        where: { userId_ingredientId: { userId, ingredientId: input.ingredientId } },
      });
      if (existing) {
        throw ApiError.conflict("Nguyên liệu này đã có trong kho, hãy dùng API update");
      }

      return tx.userIngredient.create({
        data: {
          userId,
          ingredientId: input.ingredientId,
          quantity: input.quantity ?? null,
          unitId: input.unitId ?? null,
        },
        include: { ingredient: true, unit: true },
      });
    });
  },

  async update(userId: string, ingredientId: string, input: UpdateUserIngredientInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.userIngredient.findUnique({
        where: { userId_ingredientId: { userId, ingredientId } },
      });
      if (!existing) throw ApiError.notFound("Nguyên liệu này chưa có trong kho của bạn");

      if (input.unitId) {
        const unit = await tx.unit.findUnique({ where: { unitId: input.unitId } });
        if (!unit) throw ApiError.badRequest("unitId không tồn tại");
      }

      return tx.userIngredient.update({
        where: { userId_ingredientId: { userId, ingredientId } },
        data: {
          ...(input.quantity !== undefined && { quantity: input.quantity }),
          ...(input.unitId !== undefined && { unitId: input.unitId }),
        },
        include: { ingredient: true, unit: true },
      });
    });
  },

  async remove(userId: string, ingredientId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.userIngredient.findUnique({
        where: { userId_ingredientId: { userId, ingredientId } },
      });
      if (!existing) throw ApiError.notFound("Nguyên liệu này chưa có trong kho của bạn");

      await tx.userIngredient.delete({
        where: { userId_ingredientId: { userId, ingredientId } },
      });

      return { ingredientId };
    });
  },

  async addByName(userId: string, ingredientName: string) {
    const nameClean = ingredientName.trim().toLowerCase();
    if (!nameClean) return null;

    let ingredient = await prisma.ingredient.findFirst({
      where: { ingredientName: { equals: nameClean, mode: "insensitive" } },
    });

    if (!ingredient) {
      ingredient = await prisma.ingredient.create({
        data: {
          ingredientName: ingredientName.trim(),
          createdBy: userId,
          updatedBy: userId,
        },
      });
    }

    return prisma.userIngredient.upsert({
      where: { userId_ingredientId: { userId, ingredientId: ingredient.ingredientId } },
      create: {
        userId,
        ingredientId: ingredient.ingredientId,
      },
      update: {},
      include: { ingredient: true },
    });
  },

  async removeByName(userId: string, ingredientName: string) {
    const ingredient = await prisma.ingredient.findFirst({
      where: { ingredientName: { equals: ingredientName.trim(), mode: "insensitive" } },
    });

    if (!ingredient) return null;

    return prisma.userIngredient.deleteMany({
      where: { userId, ingredientId: ingredient.ingredientId },
    });
  },

  async clearAll(userId: string) {
    return prisma.userIngredient.deleteMany({
      where: { userId },
    });
  },
};
