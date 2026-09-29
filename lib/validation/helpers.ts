import { z } from "zod";

// HTML forms submit every field as a string, and an empty field arrives as "".
// This wrapper turns "" into null (meaning "no value") before validating, so
// optional fields can be cleared on edit.
export function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    schema.nullable(),
  );
}
