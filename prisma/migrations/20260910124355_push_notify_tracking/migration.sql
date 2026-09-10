-- AlterTable
ALTER TABLE "push_subscriptions" ADD COLUMN     "last_notified_at" TIMESTAMP(3),
ADD COLUMN     "notify_stage" INTEGER NOT NULL DEFAULT 0;
