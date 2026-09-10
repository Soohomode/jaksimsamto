import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "로그인 · 작심삼토" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { error } = await searchParams;
  const notice =
    error === "confirm_failed"
      ? "확인 링크가 만료됐거나 잘못됐어요. 다시 시도해주세요."
      : error === "auth_failed"
        ? "로그인에 실패했어요. 다시 시도해주세요."
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          다시 시작하기
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          이번 3일, 다시 한 번 가볍게 시작해봐요.
        </p>
      </div>

      {notice && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          {notice}
        </p>
      )}

      <AuthForm mode="login" />
    </div>
  );
}
