import { z } from "zod";

export type FieldValidationErrors = Record<string, string>;

export function mapZodIssues(error: z.ZodError): FieldValidationErrors {
  const errors: FieldValidationErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length ? issue.path.join(".") : "_form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Validate form values without throwing; use in React submit handlers. */
export function validateForm<TSchema extends z.ZodType>(
  schema: TSchema,
  values: unknown,
): { success: true; data: z.output<TSchema>; errors: {} } | { success: false; errors: FieldValidationErrors } {
  const result = schema.safeParse(values);
  return result.success
    ? { success: true, data: result.data, errors: {} }
    : { success: false, errors: mapZodIssues(result.error) };
}

export class ApiContractError extends Error {
  constructor(readonly contractName: string, readonly issues: readonly z.core.$ZodIssue[]) {
    super(`The server returned data that does not match the expected ${contractName} contract.`);
    this.name = "ApiContractError";
  }
}

/** Validate untrusted API payloads without placing raw records or PII in errors. */
export function parseApiResponse<TSchema extends z.ZodType>(
  schema: TSchema,
  payload: unknown,
  contractName: string,
): z.output<TSchema> {
  const result = schema.safeParse(payload);
  if (!result.success) throw new ApiContractError(contractName, result.error.issues);
  return result.data;
}
