"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import {
  createQuestion,
  deleteQuestion,
  updateQuestion,
  type QuestionInput,
} from "@/lib/questions";
import { getPartMeta } from "@/lib/parts";

export type QuestionFormState = { error?: string };

function parseForm(formData: FormData): QuestionInput {
  const part = Number(formData.get("part"));
  const meta = getPartMeta(part);
  const choiceCount = meta?.choiceCount ?? 4;

  const choices: string[] = [];
  for (let i = 0; i < choiceCount; i++) {
    choices.push(String(formData.get(`choice_${i}`) ?? ""));
  }

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const passageOrderRaw = formData.get("passageOrder");

  return {
    part,
    type: String(formData.get("type") ?? "").trim() || (meta?.defaultType ?? ""),
    content: String(formData.get("content") ?? ""),
    choices,
    answer: String(formData.get("answer") ?? "A"),
    audioScript: String(formData.get("audioScript") ?? "") || null,
    explanation: String(formData.get("explanation") ?? "") || null,
    difficulty: Number(formData.get("difficulty") ?? 3),
    tags,
    isPublished: formData.get("isPublished") === "on",
    passageGroup: String(formData.get("passageGroup") ?? "") || null,
    passageOrder: passageOrderRaw ? Number(passageOrderRaw) : null,
  };
}

export async function createQuestionAction(
  _prev: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  await requireAdmin();
  try {
    await createQuestion(parseForm(formData));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "저장에 실패했어요." };
  }
  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

export async function updateQuestionAction(
  id: string,
  _prev: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  await requireAdmin();
  try {
    await updateQuestion(id, parseForm(formData));
  } catch (e) {
    return { error: e instanceof Error ? e.message : "저장에 실패했어요." };
  }
  revalidatePath("/admin/questions");
  revalidatePath(`/admin/questions/${id}/edit`);
  redirect("/admin/questions");
}

export async function deleteQuestionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (id) {
    await deleteQuestion(id);
    revalidatePath("/admin/questions");
  }
}
