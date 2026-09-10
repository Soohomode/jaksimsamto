import { PrismaClient } from "@prisma/client";
import { seedQuestions } from "./seed-data/questions";

const prisma = new PrismaClient();

async function seedChallenges() {
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

async function seedQuestionBank() {
  for (const q of seedQuestions) {
    const data = {
      part: q.part,
      type: q.type,
      content: q.content,
      choices: q.choices,
      answer: q.answer,
      audioScript: q.audioScript ?? null,
      explanation: q.explanation ?? null,
      difficulty: q.difficulty ?? 3,
      tags: q.tags ?? [],
      isPublished: true,
      passageGroup: q.passageGroup ?? null,
      passageOrder: q.passageOrder ?? null,
    };

    const existing = await prisma.question.findFirst({
      where: { part: q.part, content: q.content },
      select: { id: true },
    });

    if (existing) {
      await prisma.question.update({ where: { id: existing.id }, data });
    } else {
      await prisma.question.create({ data });
    }
  }
  console.log(`Seeded ${seedQuestions.length} sample questions.`);
}

async function main() {
  await seedChallenges();
  await seedQuestionBank();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
