import "dotenv/config";
import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Kết nối CockroachDB thành công");

    app.listen(env.port, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${env.port}`);
      console.log(`   Môi trường: ${env.nodeEnv}`);
    });
  } catch (err) {
    console.error("❌ Không thể kết nối database:", err);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
