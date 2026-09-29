import { z } from "zod";

// Clean up first (trim, lowercase), then check the format.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address"));

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email,
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .max(128, "Use at most 128 characters"),
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
