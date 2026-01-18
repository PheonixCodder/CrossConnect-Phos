import z from "zod";

export const formSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1, { error: "Password is required" }),
    confirmPassword: z
      .string()
      .min(1, { error: "Please confirm your password" }),
    full_name: z.string().min(2, "Full name is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type FormValues = z.infer<typeof formSchema>;
