"use client";

import { useCallback, useEffect, useState } from "react";

function urlBase64ToBytes(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
  return buffer;
}

type Status = "loading" | "unsupported" | "denied" | "off" | "on" | "working";

export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;

  useEffect(() => {
    let cancelled = false;
    const detect = async () => {
      if (!supported || !vapid) return "unsupported" as const;
      if (Notification.permission === "denied") return "denied" as const;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        return sub ? ("on" as const) : ("off" as const);
      } catch {
        return "off" as const;
      }
    };
    void detect().then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, [supported, vapid]);

  const enable = useCallback(async () => {
    if (!vapid) return;
    setError(null);
    setStatus("working");
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBytes(vapid),
      });

      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), test: true }),
      });
      if (!res.ok) throw new Error("서버 등록 실패");

      setStatus("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "알림을 켜지 못했어요.");
      setStatus("off");
    }
  }, [vapid]);

  const disable = useCallback(async () => {
    setError(null);
    setStatus("working");
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("off");
    } catch {
      setStatus("on");
    }
  }, []);

  if (status === "loading") return null;

  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            스트릭 끊기기 전 알림
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            마지막 학습 후 48시간·66시간쯤 웹 푸시로 한 번씩 알려드려요.
          </p>
        </div>

        {status === "on" && (
          <button
            type="button"
            onClick={disable}
            className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            알림 끄기
          </button>
        )}
        {status === "off" && (
          <button
            type="button"
            onClick={enable}
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            알림 켜기
          </button>
        )}
        {status === "working" && (
          <span className="shrink-0 text-sm text-zinc-400">처리 중…</span>
        )}
      </div>

      {status === "on" && (
        <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
          알림이 켜져 있어요. 방금 테스트 알림을 보냈어요.
        </p>
      )}
      {status === "denied" && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          브라우저에서 이 사이트의 알림이 차단돼 있어요. 사이트 설정에서 허용으로
          바꿔주세요.
        </p>
      )}
      {status === "unsupported" && (
        <p className="mt-2 text-xs text-zinc-400">
          이 브라우저는 웹 푸시를 지원하지 않아요. (iOS는 홈 화면에 추가한 PWA
          상태에서만 동작해요.)
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
