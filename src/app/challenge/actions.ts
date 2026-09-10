"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { advanceSprint } from "@/lib/sprint";

/** 활성 스프린트가 없을 때 새로 시작한다. */
export async function startSprint() {
  const user = await requireUser();
  await advanceSprint(user.id);
  revalidatePath("/challenge");
  revalidatePath("/dashboard");
}
