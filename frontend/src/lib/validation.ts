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

/** Safe validation result for React form submit handlers and service boundaries. */
export function validateForm<TSchema extends z.ZodType>(
  schema: TSchema,
  values: unknown,
): { success: true; data: z.output<TSchema>; errors: {} } | { success: false; errors: FieldValidationErrors } {
  const result = schema.safeParse(values);
  return result.success
    ? { success: true, data: result.data, errors: {} }
    : { success: false, errors: mapZodIssues(result.error) };
}

export class InputValidationError extends Error {
  readonly fieldErrors: FieldValidationErrors;

  constructor(readonly contractName: string, error: z.ZodError) {
    super(`Invalid ${contractName} input: ${Object.keys(mapZodIssues(error)).length} field(s) need attention.`);
    this.name = "InputValidationError";
    this.fieldErrors = mapZodIssues(error);
  }
}

/** Enforce a request schema before serializing/sending user-controlled data. */
export function parseApiInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
  contractName: string,
): z.output<TSchema> {
  const result = schema.safeParse(input);
  if (!result.success) throw new InputValidationError(contractName, result.error);
  return result.data;
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
