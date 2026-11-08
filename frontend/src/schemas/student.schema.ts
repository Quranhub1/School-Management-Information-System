import { z } from "zod";
import { emailSchema, identifierSchema, isoDateSchema, phoneSchema, requiredTextSchema } from "./common.schema";

export const studentAdmissionSchema = z.object({
  admissionNumber: identifierSchema,
  firstName: requiredTextSchema.min(2, "First name must contain at least 2 characters."),
  lastName: requiredTextSchema.min(2, "Last name must contain at least 2 characters."),
  dateOfBirth: isoDateSchema,
  gender: z.enum(["Male", "Female", "Other"]),
  programmeId: identifierSchema,
  admissionYear: z.number().int().min(2000).max(2100),
  phoneNumber: phoneSchema,
  email: emailSchema,
  guardianName: requiredTextSchema,
  guardianPhone: phoneSchema,
});
export type StudentAdmissionInput = z.infer<typeof studentAdmissionSchema>;
