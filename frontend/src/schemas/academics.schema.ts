import { z } from "zod";
import { identifierSchema, isoDateSchema } from "./common.schema";

export const timetableEntrySchema = z.object({
  classId: identifierSchema,
  subjectId: identifierSchema,
  teacherId: identifierSchema,
  roomId: identifierSchema,
  date: isoDateSchema,
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:mm time."),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:mm time."),
}).refine((value) => value.endTime > value.startTime, {
  path: ["endTime"],
  message: "End time must be later than start time.",
});
export const examinationResultSchema = z.object({
  studentId: identifierSchema,
  assessmentId: identifierSchema,
  score: z.number().finite().nonnegative(),
  maximumScore: z.number().finite().positive(),
}).refine((value) => value.score <= value.maximumScore, {
  path: ["score"],
  message: "Score cannot exceed the maximum score.",
});
