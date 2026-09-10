import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버(Server Component / Route Handler / Server Action)에서 쓰는 Supabase 클라이언트.
 * Next.js 16에서 `cookies()`는 비동기이므로 반드시 await 한다.
 *
 * Server Component에서 호출하면 쿠키 쓰기가 무시될 수 있는데(정상), 세션 갱신은
 * `src/proxy.ts`가 담당하므로 문제되지 않는다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component에서 호출된 경우. proxy.ts가 세션을 갱신하므로 무시 가능.
          }
        },
      },
    },
  );
}
