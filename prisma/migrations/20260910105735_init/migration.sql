-- CreateTable
CREATE TABLE "questions" (
    "id" UUID NOT NULL,
    "part" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "choices" JSONB NOT NULL,
    "answer" TEXT NOT NULL,
    "audio_script" TEXT,
    "explanation" TEXT,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_states" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "ease" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "interval_days" INTEGER NOT NULL DEFAULT 0,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "next_review_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "elapsed_ms" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'practice',
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mock_exam_results" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lc_raw_score" INTEGER NOT NULL,
    "rc_raw_score" INTEGER NOT NULL,
    "lc_estimated" INTEGER NOT NULL,
    "rc_estimated" INTEGER NOT NULL,
    "estimated_score" INTEGER NOT NULL,
    "duration_sec" INTEGER,
    "taken_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mock_exam_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sprint_challenges" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "day_range" INTEGER NOT NULL DEFAULT 3,
    "mission_type" TEXT NOT NULL,
    "target_count" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sprint_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sprint_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "challenge_id" UUID NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "user_sprint_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_streaks" (
    "user_id" UUID NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_completed_date" DATE,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "push_subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questions_part_idx" ON "questions"("part");

-- CreateIndex
CREATE INDEX "questions_type_idx" ON "questions"("type");

-- CreateIndex
CREATE INDEX "review_states_user_id_next_review_at_idx" ON "review_states"("user_id", "next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "review_states_user_id_question_id_key" ON "review_states"("user_id", "question_id");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_attempted_at_idx" ON "quiz_attempts"("user_id", "attempted_at");

-- CreateIndex
CREATE INDEX "quiz_attempts_user_id_is_correct_idx" ON "quiz_attempts"("user_id", "is_correct");

-- CreateIndex
CREATE INDEX "mock_exam_results_user_id_taken_at_idx" ON "mock_exam_results"("user_id", "taken_at");

-- CreateIndex
CREATE UNIQUE INDEX "sprint_challenges_title_key" ON "sprint_challenges"("title");

-- CreateIndex
CREATE INDEX "user_sprint_progress_user_id_idx" ON "user_sprint_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sprint_progress_user_id_challenge_id_key" ON "user_sprint_progress"("user_id", "challenge_id");

-- CreateIndex
CREATE UNIQUE INDEX "push_subscriptions_endpoint_key" ON "push_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

-- AddForeignKey
ALTER TABLE "review_states" ADD CONSTRAINT "review_states_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sprint_progress" ADD CONSTRAINT "user_sprint_progress_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "sprint_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;
