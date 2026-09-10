"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText,
}: {
  children: React.ReactNode;
  pendingText?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (pendingText ?? "처리 중…") : children}
    </button>
  );
}
