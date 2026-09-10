import Link from "next/link";
import { requireAdmin } from "@/lib/admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div className="flex items-baseline gap-3">
          <Link href="/admin" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            작심삼토 관리자
          </Link>
          <nav className="flex gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <Link href="/admin/questions" className="hover:text-zinc-900 dark:hover:text-zinc-100">
              문제은행
            </Link>
          </nav>
        </div>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← 대시보드
        </Link>
      </header>
      {children}
    </div>
  );
}
