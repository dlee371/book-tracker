"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/form-state";

type NoteFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initialValues?: Record<string, string>;
  submitLabel: string;
  cancelHref?: string;
};

export function NoteForm({
  action,
  initialValues,
  submitLabel,
  cancelHref,
}: NoteFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initialValues ?? {};
  const errors = state.fieldErrors ?? {};

  return (
    // Keyed on its values so it re-fills after an error (see BookForm).
    <form
      key={JSON.stringify(values)}
      action={formAction}
      className="grid gap-3"
    >
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_7rem]">
        <div className="grid gap-1.5">
          <Label htmlFor="note-title">Title (optional)</Label>
          <Input id="note-title" name="title" defaultValue={values.title} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="note-page">Page</Label>
          <Input
            id="note-page"
            name="page"
            type="number"
            inputMode="numeric"
            min={1}
            defaultValue={values.page}
            aria-invalid={errors.page ? true : undefined}
          />
          {errors.page && (
            <p className="text-sm text-destructive">{errors.page[0]}</p>
          )}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="note-body">Note</Label>
        <Textarea
          id="note-body"
          name="body"
          rows={5}
          defaultValue={values.body}
          placeholder="What stood out? Markdown works: **bold**, lists, > quotes"
          aria-invalid={errors.body ? true : undefined}
        />
        {errors.body && (
          <p className="text-sm text-destructive">{errors.body[0]}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        {cancelHref && (
          <Link href={cancelHref} className={buttonVariants({ variant: "ghost" })}>
            Cancel
          </Link>
        )}
      </div>
    </form>
  );
}
