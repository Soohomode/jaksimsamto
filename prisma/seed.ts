import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * 시드 데이터.
 * - 스프린트 챌린지(정적 설정성 데이터)는 여기서 생성한다.
 * - 문제은행(Question) 시드는 6단계에서 추가 예정. (TODO)
 */
async function main() {
  const challenges = [
    {
      title: "3일 단어 스프린트",
      description: "3일 안에 필수 단어 90개를 암기하고 복습까지 마치기",
      dayRange: 3,
      missionType: "vocab",
      targetCount: 90,
      orderIndex: 1,
    },
    {
      title: "3일 LC 집중",
      description: "Part 1~4 문제를 3일간 매일 20문항씩 풀기",
      dayRange: 3,
      missionType: "quiz",
      targetCount: 60,
      orderIndex: 2,
    },
    {
      title: "3일 RC 집중",
      description: "Part 5~7 문제를 3일간 매일 20문항씩 풀기",
      dayRange: 3,
      missionType: "quiz",
      targetCount: 60,
      orderIndex: 3,
    },
    {
      title: "3일 마무리 모의고사",
      description: "3일 차에 LC+RC 풀 모의고사 1회 완주",
      dayRange: 3,
      missionType: "mock",
      targetCount: 1,
      orderIndex: 4,
    },
  ];

  for (const c of challenges) {
    await prisma.sprintChallenge.upsert({
      where: { title: c.title },
      update: c,
      create: c,
    });
  }

  console.log(`Seeded ${challenges.length} sprint challenges.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
