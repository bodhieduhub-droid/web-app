import { z } from "zod";

export const enquirySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  phone: z.string().regex(/^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$/, "Please enter a valid phone number."),
  email: z.string().email("Please enter a valid email address."),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
