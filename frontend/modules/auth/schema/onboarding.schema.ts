import { z } from "zod";

export const onboardingSchema = z.object({
  organizationName: z
    .string()
    .min(2, "Organization name is required"),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
