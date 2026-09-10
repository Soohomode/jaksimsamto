import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";

/** .env 의 ADMIN_EMAILS (쉼표 구분) 목록. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  if (!user?.email) return false;
  return adminEmails().includes(user.email.toLowerCase());
}

/** 관리자가 아니면 리다이렉트. 관리자 페이지 진입점에서 사용. */
export async function requireAdmin() {
  const user = await getUser();
  if (!user) redirect("/login?redirectedFrom=/admin");
  if (!user.email || !adminEmails().includes(user.email.toLowerCase())) {
    redirect("/dashboard?error=forbidden");
  }
  return user;
}
