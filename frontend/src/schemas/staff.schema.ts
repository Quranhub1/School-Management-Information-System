import { z } from "zod";
import { emailSchema, identifierSchema, isoDateSchema, phoneSchema, requiredTextSchema } from "./common.schema";

export const staffRecordSchema = z.object({
  staffNumber: identifierSchema,
  firstName: requiredTextSchema.min(2),
  lastName: requiredTextSchema.min(2),
  departmentId: identifierSchema,
  roleId: identifierSchema,
  phoneNumber: phoneSchema,
  email: emailSchema,
  employmentType: z.enum(["Permanent", "Contract", "PartTime", "Temporary"]),
});
export const leaveApplicationSchema = z.object({
  staffId: identifierSchema,
  leaveTypeId: identifierSchema,
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  reason: requiredTextSchema.min(5),
}).refine((value) => value.endDate >= value.startDate, {
  path: ["endDate"],
  message: "End date cannot be before start date.",
});
export type StaffRecordInput = z.infer<typeof staffRecordSchema>;
