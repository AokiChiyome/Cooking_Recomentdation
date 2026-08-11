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
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
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
      throw ApiError.conflict("Email này đã được đăng ký tài khoản khác");
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const newUserId = randomUUID();

    // 1. Tự động tìm hoặc tạo mặc định Role USER trong CSDL CockroachDB
    let role = await prisma.role.findFirst({
      where: {
        roleName: { equals: "USER", mode: "insensitive" },
      },
    });

    if (!role) {
      role = await prisma.role.create({
        data: {
          roleId: randomUUID(),
          roleName: "USER",
          createdBy: newUserId,
          updatedBy: newUserId,
        },
      });
    }

    // 2. Tạo tài khoản người dùng và tự động kết nối với Role USER mặc định
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

    const userProfile = await authService.getProfile(userId);

    return {
      user: userProfile,
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

    if (!user) throw ApiError.notFound("Không tìm thấy thông tin người dùng");

    const roleName = user.role && user.role.length > 0 ? user.role[0].roleName : "USER";

    return {
      userId: user.userId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: roleName,
      createdAt: user.createdAt,
    };
  },
};
