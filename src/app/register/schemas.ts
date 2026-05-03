import { z } from "zod";

export const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  phone: z
    .string()
    .transform((val) => val.replace(/\s+/g, ""))
    .pipe(
      z.string().regex(/^(?:\+91|0)?[6-9]\d{9}$/, "Please enter a valid 10-digit Indian phone number.")
    ),
  email: z.string().email("Please enter a valid email address."),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
