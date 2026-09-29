"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/form-state";
import { RELATIONS } from "@/lib/idea-links";

type IdeaOption = { id: string; title: string; sources: string };

export function ConnectForm({
  action,
  ideaTitle,
  candidates,
  cancelHref,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  ideaTitle: string;
  candidates: IdeaOption[];
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    // Keyed on its values so it re-fills after an error (see BookForm).
    <form key={JSON.stringify(values)} action={formAction} className="grid gap-5">
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="relation">
          “{ideaTitle}”…
        </Label>
        <NativeSelect
          id="relation"
          name="relation"
          defaultValue={values.relation ?? "SUPPORTS"}
          className="w-full sm:w-64"
        >
          {Object.entries(RELATIONS).map(([value, { label }]) => (
            <NativeSelectOption key={value} value={value}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">…this idea:</legend>
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No other ideas match.</p>
        ) : (
          <div className="grid max-h-80 gap-1 overflow-y-auto rounded-lg border p-2">
            {candidates.map((idea) => (
              <label
                key={idea.id}
                className="flex items-start gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted has-checked:bg-muted"
              >
                <input
                  type="radio"
                  name="targetIdeaId"
                  value={idea.id}
                  defaultChecked={values.targetIdeaId === idea.id}
                  className="mt-0.5 size-4 accent-primary"
                  required
                />
                <span className="grid">
                  <span>{idea.title}</span>
                  <span className="text-xs text-muted-foreground">{idea.sources}</span>
                </span>
              </label>
            ))}
          </div>
        )}
        {errors.targetIdeaId && (
          <p className="text-sm text-destructive">{errors.targetIdeaId[0]}</p>
        )}
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor="comment">Why do they connect? (optional)</Label>
        <Textarea
          id="comment"
          name="comment"
          rows={3}
          defaultValue={values.comment}
          placeholder="e.g. Both describe cues triggering automatic behavior"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending || candidates.length === 0}>
          {pending ? "Connecting…" : "Connect"}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
