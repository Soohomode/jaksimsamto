import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * Prisma 설정 파일 (package.json#prisma 대체).
 * 이 파일이 있으면 Prisma가 .env 를 자동 로드하지 않으므로,
 * DB 관련 명령은 package.json 스크립트에서 `dotenv -e .env.local` 로 감싼다.
 */
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
