"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FormState } from "@/lib/form-state";

type BookOption = { id: string; title: string; author: string };

type IdeaFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  // Comma-separated lists for bookIds / noteIds (see readIdeaForm).
  initialValues?: Record<string, string>;
  books: BookOption[];
  // Books of supporting notes: always sources, so shown checked and locked.
  lockedBookIds?: string[];
  submitLabel: string;
  cancelHref: string;
};

export function IdeaForm({
  action,
  initialValues,
  books,
  lockedBookIds = [],
  submitLabel,
  cancelHref,
}: IdeaFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initialValues ?? {};
  const errors = state.fieldErrors ?? {};
  const split = (list?: string) => (list ? list.split(",").filter(Boolean) : []);
  const checkedBookIds = new Set([...split(values.bookIds), ...lockedBookIds]);
  const locked = new Set(lockedBookIds);

  return (
    // Keyed on its values so it re-fills after an error (see BookForm).
    <form key={JSON.stringify(values)} action={formAction} className="grid gap-5">
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      {split(values.noteIds).map((noteId) => (
        <input key={noteId} type="hidden" name="noteIds" value={noteId} />
      ))}

      <div className="grid gap-1.5">
        <Label htmlFor="idea-title">Idea</Label>
        <Input
          id="idea-title"
          name="title"
          defaultValue={values.title}
          placeholder="Environment strongly influences behavior"
          aria-invalid={errors.title ? true : undefined}
          required
        />
        {errors.title ? (
          <p className="text-sm text-destructive">{errors.title[0]}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            State it in your own words, as something you could agree or disagree with.
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="idea-explanation">Explanation (optional)</Label>
        <Textarea
          id="idea-explanation"
          name="explanation"
          rows={6}
          defaultValue={values.explanation}
          placeholder="Why it's true, where it applies, examples… Markdown works."
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="idea-tags">Tags</Label>
        <Input
          id="idea-tags"
          name="tags"
          defaultValue={values.tags}
          placeholder="behavior, environment"
          aria-invalid={errors.tags ? true : undefined}
        />
        {errors.tags ? (
          <p className="text-sm text-destructive">{errors.tags[0]}</p>
        ) : (
          <p className="text-xs text-muted-foreground">Separate with commas</p>
        )}
      </div>

      <fieldset className="grid gap-1.5">
        <legend className="mb-1.5 text-sm font-medium">Source books</legend>
        {books.length === 0 ? (
          <p className="text-sm text-muted-foreground">No books in your library yet.</p>
        ) : (
          <div className="grid max-h-64 gap-1 overflow-y-auto rounded-lg border p-2">
            {books.map((book) => (
              <label
                key={book.id}
                className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-muted"
              >
                <input
                  type="checkbox"
                  name="bookIds"
                  value={book.id}
                  defaultChecked={checkedBookIds.has(book.id)}
                  disabled={locked.has(book.id)}
                  className="size-4 accent-primary"
                />
                <span>{book.title}</span>
                <span className="text-muted-foreground">· {book.author}</span>
                {locked.has(book.id) && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    has supporting notes
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Link href={cancelHref} className={buttonVariants({ variant: "ghost" })}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
