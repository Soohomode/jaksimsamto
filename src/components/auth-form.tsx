"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/app/auth/actions";
import { SubmitButton } from "@/components/submit-button";

const initialState: AuthState = {};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        이메일
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="h-11 rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        비밀번호
        <input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "signup" ? "8자 이상" : "••••••••"}
          className="h-11 rounded-xl border border-zinc-300 bg-white px-3.5 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </label>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          {state.message}
        </p>
      )}

      <SubmitButton pendingText={mode === "login" ? "로그인 중…" : "가입 중…"}>
        {mode === "login" ? "로그인" : "가입하고 시작하기"}
      </SubmitButton>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        {mode === "login" ? (
          <>
            아직 계정이 없으세요?{" "}
            <Link
              href="/signup"
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              가입하기
            </Link>
          </>
        ) : (
          <>
            이미 계정이 있으세요?{" "}
            <Link
              href="/login"
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              로그인
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
