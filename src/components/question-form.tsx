"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ALL_PARTS, getPartMeta, indexToChoiceKey } from "@/lib/parts";
import type { QuestionFormState } from "@/app/admin/actions";
import { SubmitButton } from "@/components/submit-button";

export interface QuestionFormValues {
  part: number;
  type: string;
  content: string;
  choices: string[];
  answer: string;
  audioScript: string;
  explanation: string;
  difficulty: number;
  tags: string[];
  isPublished: boolean;
  passageGroup: string;
  passageOrder: number | null;
}

const empty: QuestionFormValues = {
  part: 5,
  type: "",
  content: "",
  choices: ["", "", "", ""],
  answer: "A",
  audioScript: "",
  explanation: "",
  difficulty: 3,
  tags: [],
  isPublished: true,
  passageGroup: "",
  passageOrder: null,
};

const fieldCls =
  "rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
const labelCls =
  "flex flex-col gap-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function QuestionForm({
  action,
  initial,
  submitLabel,
}: {
  action: (
    prev: QuestionFormState,
    formData: FormData,
  ) => Promise<QuestionFormState>;
  initial?: Partial<QuestionFormValues>;
  submitLabel: string;
}) {
  const start = { ...empty, ...initial };
  const [state, formAction] = useActionState(action, {});
  const [part, setPart] = useState(start.part);
  const [choices, setChoices] = useState<string[]>(() => {
    const meta = getPartMeta(start.part);
    const n = meta?.choiceCount ?? 4;
    return Array.from({ length: n }, (_, i) => start.choices[i] ?? "");
  });

  const meta = getPartMeta(part)!;

  function changePart(next: number) {
    setPart(next);
    const n = getPartMeta(next)?.choiceCount ?? 4;
    setChoices((prev) => Array.from({ length: n }, (_, i) => prev[i] ?? ""));
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelCls}>
          파트
          <select
            name="part"
            value={part}
            onChange={(e) => changePart(Number(e.target.value))}
            className={fieldCls}
          >
            {ALL_PARTS.map((p) => (
              <option key={p.part} value={p.part}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        <label className={labelCls}>
          유형(type)
          <input
            name="type"
            defaultValue={start.type}
            placeholder={meta.defaultType}
            className={fieldCls}
          />
        </label>

        <label className={labelCls}>
          난이도 (1~5)
          <input
            name="difficulty"
            type="number"
            min={1}
            max={5}
            defaultValue={start.difficulty}
            className={fieldCls}
          />
        </label>
      </div>

      <label className={labelCls}>
        문제 본문 {meta.grouped && "(지문/질문 stem)"}
        <textarea
          name="content"
          rows={meta.section === "RC" ? 6 : 3}
          defaultValue={start.content}
          required
          className={fieldCls}
        />
      </label>

      {meta.hasAudio && (
        <label className={labelCls}>
          음성 대본 (audioScript · TTS 재생용)
          <textarea
            name="audioScript"
            rows={4}
            defaultValue={start.audioScript}
            placeholder={
              meta.part === 3 || meta.part === 4
                ? "화자 구분은 줄바꿈으로. 예:\nW: Have you finished the report?\nM: Not yet, I'm still waiting on the numbers."
                : ""
            }
            className={fieldCls}
          />
        </label>
      )}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          보기 ({meta.choiceCount}개) · 정답 선택
        </legend>
        {choices.map((val, i) => {
          const key = indexToChoiceKey(i);
          return (
            <div key={i} className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-500">
                <input
                  type="radio"
                  name="answer"
                  value={key}
                  defaultChecked={start.answer === key}
                  required
                />
                ({key})
              </label>
              <input
                name={`choice_${i}`}
                value={val}
                onChange={(e) =>
                  setChoices((prev) =>
                    prev.map((c, j) => (j === i ? e.target.value : c)),
                  )
                }
                required
                className={`${fieldCls} flex-1`}
              />
            </div>
          );
        })}
      </fieldset>

      <label className={labelCls}>
        해설 (선택)
        <textarea
          name="explanation"
          rows={3}
          defaultValue={start.explanation}
          className={fieldCls}
        />
      </label>

      {meta.grouped && (
        <div className="grid gap-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900/50 sm:grid-cols-2">
          <label className={labelCls}>
            지문 그룹 키 (passageGroup)
            <input
              name="passageGroup"
              defaultValue={start.passageGroup}
              placeholder="예: pt3-set-001"
              className={fieldCls}
            />
          </label>
          <label className={labelCls}>
            그룹 내 순서 (1부터)
            <input
              name="passageOrder"
              type="number"
              min={1}
              defaultValue={start.passageOrder ?? undefined}
              className={fieldCls}
            />
          </label>
          <p className="text-xs text-zinc-400 sm:col-span-2">
            같은 그룹 키를 가진 문항끼리 하나의 음성/지문을 공유합니다.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelCls}>
          태그 (쉼표로 구분)
          <input
            name="tags"
            defaultValue={start.tags.join(", ")}
            placeholder="가정법, 접속사"
            className={fieldCls}
          />
        </label>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={start.isPublished}
          />
          공개 (학습자에게 노출)
        </label>
      </div>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-4">
        <div className="w-44">
          <SubmitButton pendingText="저장 중…">{submitLabel}</SubmitButton>
        </div>
        <Link
          href="/admin/questions"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
