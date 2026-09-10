import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * 로그인된 유저를 반환. 없으면 /login 으로 리다이렉트.
 * 보호된 Server Component / Server Action 진입점에서 사용.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return user;
}

/** 로그인 여부만 알고 싶을 때. 리다이렉트 없음. */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
