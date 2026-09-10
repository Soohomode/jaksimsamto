import { createBrowserClient } from "@supabase/ssr";

/**
 * 브라우저(Client Component)에서 쓰는 Supabase 클라이언트.
 * 매 호출마다 새로 만들어도 내부적으로 싱글턴처럼 동작한다.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
