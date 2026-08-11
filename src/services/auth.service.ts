import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { LoginInput, RegisterInput } from "../validators/auth.validator";
import { env } from "../config/env";

const SALT_ROUNDS = 10;

function msFromExpiresIn(expiresIn: string): number {
  // hỗ trợ định dạng đơn giản như "15m", "7d", "1h"
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * unitMs[unit];
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw ApiError.conflict("Email đã được đăng ký");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const newUserId = randomUUID();

    const role = await prisma.role.findUnique({
      where: {
        roleName: "user",
      },
    });

    if (!role) {
      throw ApiError.internal("Role USER không tồn tại");
    }

    const user = await prisma.user.create({
      data: {
        userId: newUserId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        password: passwordHash,
        createdBy: newUserId,
        updatedBy: newUserId,

        role: {
          connect: {
            roleId: role.roleId,
          },
        },
      },
    });

    return authService.issueTokens(user.userId, user.email);
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      throw ApiError.unauthorized("Email hoặc mật khẩu không đúng");
    }

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) {
      throw ApiError.unauthorized("Email hoặc mật khẩu không đúng");
    }

    return authService.issueTokens(user.userId, user.email);
  },

  async issueTokens(userId: string, email: string) {
    const payload = { userId, email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const expiresAt = new Date(
      Date.now() + msFromExpiresIn(env.jwt.refreshExpiresIn),
    );

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      user: { id: userId, email },
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Refresh token không hợp lệ hoặc đã hết hạn");
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw ApiError.unauthorized("Refresh token không hợp lệ hoặc đã hết hạn");
    }

    // Xoay vòng refresh token: thu hồi token cũ, phát hành token mới
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    return authService.issueTokens(payload.userId, payload.email);
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,

        role: {
          select: {
            roleId: true,
            roleName: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound("Không tìm thấy người dùng");
    }

    return user;
  },
};
