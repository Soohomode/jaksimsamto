import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import {
  removeSubscription,
  saveSubscription,
  sendPushToUser,
  type PushSubscriptionInput,
} from "@/lib/push";

/** 구독 등록 + 테스트 발송. */
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { subscription?: PushSubscriptionInput; test?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const sub = body.subscription;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "invalid subscription" }, { status: 400 });
  }

  await saveSubscription(user.id, sub, request.headers.get("user-agent") ?? undefined);

  if (body.test) {
    await sendPushToUser(user.id, {
      title: "작심삼토 알림 켜짐 🔔",
      body: "스트릭이 끊기기 전에 여기로 알려드릴게요.",
      url: "/challenge",
      tag: "test",
    });
  }

  return NextResponse.json({ ok: true });
}

/** 구독 해지. */
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { endpoint?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  if (body.endpoint) await removeSubscription(body.endpoint);
  return NextResponse.json({ ok: true });
}
