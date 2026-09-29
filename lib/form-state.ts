// Shared shape for forms that submit to a server action with useActionState.

// What an action hands back to the form when something is wrong.
// On success, actions usually redirect instead.
export type FormState = {
  fieldErrors?: Partial<Record<string, string[]>>;
  message?: string;
  // The submitted values, so the form can re-fill itself after an error.
  values?: Record<string, string>;
};

// Plain text fields from a submitted form, as { name: value }.
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    // Skip React's internal fields (prefixed with "$") and file uploads.
    if (typeof value === "string" && !key.startsWith("$")) {
      values[key] = value;
    }
  }
  return values;
}
