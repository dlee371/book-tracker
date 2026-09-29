"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { STATUS_LABELS, STATUS_OPTIONS, type BookFormValues } from "@/lib/books";
import type { FormState } from "@/lib/form-state";

type BookFormProps = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initialValues?: BookFormValues;
  submitLabel: string;
  cancelHref: string;
};

export function BookForm({
  action,
  initialValues,
  submitLabel,
  cancelHref,
}: BookFormProps) {
  // useActionState runs the server action and keeps whatever it returns
  // (errors + submitted values) as `state`. `pending` is true while it runs.
  const [state, formAction, pending] = useActionState(action, {});

  // After an error, show what the user typed rather than the original values.
  const values = state.values ?? initialValues ?? {};
  const errors = state.fieldErrors ?? {};

  // Props shared by every field: name, default value, and error wiring.
  function field(name: string) {
    const error = errors[name]?.[0];
    return {
      id: name,
      name,
      defaultValue: values[name] ?? "",
      "aria-invalid": error ? true : undefined,
      "aria-describedby": error ? `${name}-error` : undefined,
    };
  }

  return (
    // After an action, React resets the form to its default values, but
    // <select> elements keep the defaults from their first render. Keying the
    // form on its values rebuilds it, so every field shows the submitted value.
    <form
      key={JSON.stringify(values)}
      action={formAction}
      className="grid gap-5"
    >
      {state.message && (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="title" label="Title" error={errors.title}>
          <Input {...field("title")} required />
        </Field>
        <Field name="author" label="Author" error={errors.author}>
          <Input {...field("author")} required />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="status" label="Status" error={errors.status}>
          <NativeSelect
            {...field("status")}
            defaultValue={values.status ?? "WANT_TO_READ"}
            className="w-full"
          >
            {STATUS_OPTIONS.map((status) => (
              <NativeSelectOption key={status} value={status}>
                {STATUS_LABELS[status]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field name="rating" label="Rating" error={errors.rating}>
          <NativeSelect {...field("rating")} className="w-full">
            <NativeSelectOption value="">No rating</NativeSelectOption>
            {[5, 4, 3, 2, 1].map((n) => (
              <NativeSelectOption key={n} value={n}>
                {"★".repeat(n)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field name="startedAt" label="Date started" error={errors.startedAt}>
          <Input type="date" {...field("startedAt")} />
        </Field>
        <Field name="finishedAt" label="Date finished" error={errors.finishedAt}>
          <Input type="date" {...field("finishedAt")} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Field name="genre" label="Genre" error={errors.genre}>
          <Input {...field("genre")} placeholder="e.g. Psychology" />
        </Field>
        <Field
          name="publicationYear"
          label="Publication year"
          error={errors.publicationYear}
        >
          <Input type="number" inputMode="numeric" {...field("publicationYear")} />
        </Field>
        <Field name="pageCount" label="Pages" error={errors.pageCount}>
          <Input type="number" inputMode="numeric" min={1} {...field("pageCount")} />
        </Field>
      </div>

      <Field name="coverUrl" label="Cover image URL" error={errors.coverUrl}>
        <Input type="url" {...field("coverUrl")} placeholder="https://…" />
      </Field>

      <Field name="description" label="Description" error={errors.description}>
        <Textarea {...field("description")} rows={3} />
      </Field>

      <Field name="review" label="Your review" error={errors.review}>
        <Textarea {...field("review")} rows={5} />
      </Field>

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

function Field({
  name,
  label,
  error,
  children,
}: {
  name: string;
  label: string;
  error?: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error[0]}
        </p>
      )}
    </div>
  );
}
