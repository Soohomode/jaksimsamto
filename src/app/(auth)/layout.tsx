import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 block text-center text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          작심삼토
        </Link>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
          {children}
        </div>
        <p className="mt-6 text-center text-xs leading-5 text-zinc-400">
          3일마다 새로 시작해도 괜찮아요. 그게 쌓이면 완주니까.
        </p>
      </div>
    </div>
  );
}
