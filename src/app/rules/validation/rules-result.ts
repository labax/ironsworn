export interface ValidationError {
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}

export type RulesResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ValidationError[] };

export const rulesSuccess = <T>(value: T): RulesResult<T> => ({ ok: true, value });

export const rulesFailure = (errors: readonly ValidationError[]): RulesResult<never> => ({
  ok: false,
  errors,
});

export const rangeError = (
  field: string,
  min: number,
  max: number,
  actual: number,
): ValidationError => ({
  code: 'out_of_range',
  field,
  message: `${field} must be an integer from ${min} to ${max}; received ${actual}.`,
});
