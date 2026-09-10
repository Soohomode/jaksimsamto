import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = { title: "가입 · 작심삼토" };

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          작심삼토 시작하기
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          3일 단위로 짧게 끊어가는 토익 공부. 지금 첫 스프린트를 시작해요.
        </p>
      </div>

      <AuthForm mode="signup" />
    </div>
  );
}
